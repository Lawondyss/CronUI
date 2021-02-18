/*
 * Version: 0.1
 * Usage:
 * Create the ui by initiating new instance of `CronUI`.
 * Pass in the selector for the container element of the form,
 * and an options object.
 *
 * recurrentEventForm = new CronUI('.container', {initial: '* * * * *'});
 */
function CronUI(container, opts) {
  if (container instanceof HTMLElement) {
    this.el = container;
  } else if (typeof container === 'string') {
    this.el = document.querySelector(container);
  } else {
    throw 'CronUI: container parameter in initialization must be an html element or a string selector.';
  }

  opts = opts ? opts : {locale: {}};

  // init options
  this.options = Object.assign({
    selectClasses: '',
    labelClasses: '',
    weekStartOnMonday: false,
  }, opts);

  this.options.locale = Object.assign({
    selectPeriods: ['minute', 'hour', 'day', 'week', 'month', 'year'],
    selectMonths: [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December',
    ],
    selectDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    labelMinutes: 'at',
    labelTime: 'at',
    labelWeek: 'on',
    labelDays: 'on the',
    labelMonths: 'of',
  }, opts.locale ? opts.locale : {});


  // Render the cron form
  this.render();

  // Make sure there is an initial value and set it on.
  if (typeof this.options.initial !== 'string') {
    this.options.initial = '* * * * *'
  }

  this.setCronString(this.options.initial);
  this.currentValue = this.options.initial;
}


CronUI.prototype.render = function () {
  let el = this.el;

  /** Build some static data *******************/

  // options for minutes in an hour
  let str_opt_mih = '';
  for (let i = 0; i < 60; i++) {
    let j = (i < 10) ? '0' : '';
    str_opt_mih += "<option value='" + i + "'>" + j + i + "</option>\n";
  }

  // options for hours in a day
  let str_opt_hid = '';
  for (let i = 0; i < 24; i++) {
    let j = (i < 10) ? '0' : '';
    str_opt_hid += '<option value="' + i + '">' + j + i + "</option>\n";
  }

  // options for days of month
  let str_opt_dom = '';
  for (let i = 1; i < 32; i++) {
    str_opt_dom += '<option value="' + i + '">' + i + ".</option>\n";
  }

  // options for months
  let str_opt_month = '';
  let months = this.options.locale.selectMonths;
  for (let key in months) {
    let value = parseInt(key) + 1;
    str_opt_month += '<option value="' + value + '">' + months[key] + "</option>\n";
  }

  // options for day of week
  let str_opt_dow = [];
  let days = this.options.locale.selectDays;
  for (let key in days) {
    str_opt_dow.push('<option value="' + key + '">' + days[key] + "</option>\n");
  }
  if (this.options.weekStartOnMonday) {
    // reorder sunday to end
    str_opt_dow.push(str_opt_dow.shift());
  }
  str_opt_dow = str_opt_dow.join('');

  // options for period
  let str_opt_period = '';
  let periods = this.options.locale.selectPeriods;
  for (let key in periods) {
    let value = parseInt(key) == key ? periods[key] : key;
    str_opt_period += '<option value="' + value + '">' + periods[key] + "</option>\n";
  }


  /** Define select boxes in the right order ***/

  let blocks = {};
  let locale = this.options.locale;
  let labelCss = this.options.labelClasses;
  let selectCss = this.options.selectClasses;

  // Period
  el.insertAdjacentHTML('beforeend', '<span class="cron-period">'
      + '<select class="' + selectCss + '">' + str_opt_period + '</select></span>');
  let periodEl = el.querySelector('.cron-period select')
  periodEl.addEventListener('change', this.periodChanged.bind(this));
  periodEl.addEventListener('change', this.changeEvent.bind(this));

  // Day of month
  el.insertAdjacentHTML('beforeend', '<span class="cron-block cron-block-dom">'
      + (locale.labelDays === '' ? '' : '<span class="' + labelCss + '">' + locale.labelDays + '</span>')
      + '<select name="cron-dom" class="' + selectCss + '">' + str_opt_dom
      + '</select> </span>');
  blocks['dom'] = el.querySelector('.cron-block-dom');

  // Month
  el.insertAdjacentHTML('beforeend', '<span class="cron-block cron-block-month">'
      + (locale.labelMonths === '' ? '' : '<span class="' + labelCss + '">' + locale.labelMonths + '</span>')
      + '<select name="cron-month" class="' + selectCss + '">' + str_opt_month
      + '</select> </span>');
  blocks['month'] = el.querySelector('.cron-block-month');

  // Minutes
  el.insertAdjacentHTML('beforeend', '<span class="cron-block cron-block-mins">'
      + (locale.labelMinutes === '' ? '' : '<span class="' + labelCss + '">' + locale.labelMinutes + '</span>')
      + '<select name="cron-mins" class="' + selectCss + '">' + str_opt_mih
      + '</select> </span>');
  blocks['mins'] = el.querySelector('.cron-block-mins');

  // Day of week
  el.insertAdjacentHTML('beforeend', '<span class="cron-block cron-block-dow">'
      + (locale.labelWeek === '' ? '' : '<span class="' + labelCss + '">' + locale.labelWeek + '</span>')
      + '<select name="cron-dow" class="' + selectCss + '">' + str_opt_dow
      + '</select> </span>');
  blocks['dow'] = el.querySelector('.cron-block-dow');

  // Time
  el.insertAdjacentHTML('beforeend', '<span class="cron-block cron-block-time">'
      + (locale.labelTime !== '' ? '<span class="' + labelCss + '">' + locale.labelTime + '</span>' : '')
      + '<select name="cron-time-hour" class="cron-time-hour ' + selectCss + '">' + str_opt_hid
      + '</select>:<select name="cron-time-min" class="cron-time-min ' + selectCss + '">' + str_opt_mih
      + '</select> </span>');
  blocks['time'] = el.querySelector('.cron-block-time');

  // Attach the change event to all selectors
  for (let blockName in blocks) {
    [].forEach.call(blocks[blockName].querySelectorAll('select'), function (selectEl) {
      selectEl.addEventListener('change', this.changeEvent.bind(this));
    }.bind(this));
  }

  // Save a reference to blocks
  this.blocks = blocks;
};


CronUI.prototype.periodChanged = function () {
  let blocks = this.blocks;
  let cronPeriodEl = this.el.querySelector('.cron-period select');
  let period = cronPeriodEl.options[cronPeriodEl.selectedIndex].value;

  // Hide all current blocks
  for (let blockName in blocks) {
    blocks[blockName].style.display = 'none';
  }

  // Show only blocks that needs to be shown by the period chosen
  if (CronUI.displayMatrix.hasOwnProperty(period)) {
    let b = CronUI.displayMatrix[period];
    for (let i = 0; i < b.length; i++) {
      blocks[b[i]].style.display = '';
    }
  }
};


// The `changeEvent` is fired whenever there is a form change.
// It updates the `currentValue` of cron string and optionally calls a user set callback.
CronUI.prototype.changeEvent = function () {
  this.currentValue = this.getCronString();
  if (typeof this.options.changeEvent === 'function') {
    this.options.changeEvent(this.currentValue);
  }
};


CronUI.prototype.getCronString = function () {
  let min, hour, day, month, dow;
  min = hour = day = month = dow = '*';
  let blocks = this.blocks;
  // Helper to get value from select fields
  let getSelectValue = function (el) {
    return el.options[el.selectedIndex].value;
  };

  let selectedPeriod = getSelectValue(this.el.querySelector('.cron-period select'));
  switch (selectedPeriod) {
    case 'minute':
      break;

    case 'hour':
      min = getSelectValue(blocks['mins'].querySelector('select'));
      break;

    case 'day':
      min = getSelectValue(blocks['time'].querySelector('.cron-time-min'));
      hour = getSelectValue(blocks['time'].querySelector('.cron-time-hour'));
      break;

    case 'week':
      min = getSelectValue(blocks['time'].querySelector('.cron-time-min'));
      hour = getSelectValue(blocks['time'].querySelector('.cron-time-hour'));
      dow = getSelectValue(blocks['dow'].querySelector('select'));
      break;

    case 'month':
      min = getSelectValue(blocks['time'].querySelector('.cron-time-min'));
      hour = getSelectValue(blocks['time'].querySelector('.cron-time-hour'));
      day = getSelectValue(blocks['dom'].querySelector('select'));
      break;

    case 'year':
      min = getSelectValue(blocks['time'].querySelector('.cron-time-min'));
      hour = getSelectValue(blocks['time'].querySelector('.cron-time-hour'));
      day = getSelectValue(blocks['dom'].querySelector('select'));
      month = getSelectValue(blocks['month'].querySelector('select'));
      break;

    default:
      // we assume this only happens when customValues is set
      return selectedPeriod;
  }
  return [min, hour, day, month, dow].join(' ');
};


CronUI.prototype.setCronString = function (cronString) {
  let blocks = this.blocks;
  let cronType = CronUI.getCronType(cronString);

  if (!cronType) {
    return false;
  }

  let d = cronString.split(' ');
  let v = {
    'mins': d[0],
    'hour': d[1],
    'dom': d[2],
    'month': d[3],
    'dow': d[4]
  };

  // update appropriate select boxes
  let targets = CronUI.displayMatrix[cronType];
  for (let i = 0; i < targets.length; i++) {
    let tgt = targets[i];
    if (tgt == 'time') {
      blocks[tgt].querySelector('.cron-time-hour').value = v['hour'];

      blocks[tgt].querySelector('.cron-time-min').value = v['mins'];
    } else {
      blocks[tgt].querySelector('select').value = v[tgt];
    }
  }

  // Update the period select box
  this.el.querySelector('.cron-period select').value = cronType;
  this.periodChanged();

  return this;
};

/** Static functions and settings **************/

CronUI.displayMatrix = {
  'minute': [],
  'hour': ['mins'],
  'day': ['time'],
  'week': ['dow', 'time'],
  'month': ['dom', 'time'],
  'year': ['dom', 'month', 'time']
};


CronUI.cronTypes = {
  'minute': /^(\*\s){4}\*$/,                    // "* * * * *"
  'hour': /^\d{1,2}\s(\*\s){3}\*$/,           // "? * * * *"
  'day': /^(\d{1,2}\s){2}(\*\s){2}\*$/,      // "? ? * * *"
  'week': /^(\d{1,2}\s){2}(\*\s){2}\d{1,2}$/, // "? ? * * ?"
  'month': /^(\d{1,2}\s){3}\*\s\*$/,           // "? ? ? * *"
  'year': /^(\d{1,2}\s){4}\*$/                // "? ? ? ? *"
};


CronUI.getCronType = function (cronString) {
  // Try for provided cron string, and fallback to the instance cron string
  cronString = cronString ? cronString : this.getCronString();

  // check format of initial cron value
  let valid_cron = /^((\d{1,2}|\*)\s){4}(\d{1,2}|\*)$/
  if (typeof cronString != 'string' || !valid_cron.test(cronString)) {
    return undefined;
  }

  // check actual cron values
  let d = cronString.split(' ');
  //            mm, hh, DD, MM, DOW
  let minval = [0, 0, 1, 1, 0];
  let maxval = [59, 23, 31, 12, 6];
  for (let i = 0; i < d.length; i++) {
    if (d[i] == '*') continue;
    let v = parseInt(d[i]);
    if (v <= maxval[i] && v >= minval[i]) continue;
    // If we got here, the value is violating some rule. exit.
    return undefined;
  }

  // determine combination
  for (let type in CronUI.cronTypes) {
    if (CronUI.cronTypes[type].test(cronString)) {
      return type;
    }
  }

  // unknown combination
  return undefined;
};


module.exports = CronUI
