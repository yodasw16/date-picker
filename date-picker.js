(function ($){
	/**
	 * A new UI for picking dates
	 *
	 * @constructor
	 *
	 * @param {jQuery} input The input you want to transform into a date picker.
	 * @param {Object} options Override the config defaults if you want to.
	 */
	function DatePicker(input, options){
		var /** @type {String} */ defaultDate;

		this.input = /** @type {jQuery} */($(input));
		// Go ahead and hide the real input up front.
		this.hideInput();
		// This is used for defaults.
		this.date = new Date();
		// Defaults
		this.config = {
			spacer: '-',
			order: ['month', 'day', 'year'],
			year: {
				start: this.input.data('bound-start') || 2005,
				end: this.input.data('bound-end') || 2013,
				rangeChange: 0,
				infinite: this.input.data('infinite') || false
			},
			selected: {
				year: '',
				month: '',
				day: ''
			},
			// Reference by index
			months: [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec'
			],
			position: 'default',
			where: 'top',
			currentDay: this.date.getDate(),
			currentMonth: this.date.getMonth(),
			currentYear: this.date.getFullYear()
		};
		// Extend the defaults with user-supplied options.
		$.extend({}, this.config, options);
		// Create a unique class for multiple inputs.
		this.uniqueClass = 'dp_input_' + Math.floor(Math.random() * 11);
		// Wrap the pseudo-input and flyout.
		this.wrapper = /** @type {jQuery} */($(this.buildTagBox()));
		// If there is a default input value, use it for the date.
		defaultDate = this.input.val();
		if (defaultDate){
			this.insertDefaultDate(defaultDate.match(/(\d+)-(\d+)-(\d+)/));
		}
		// Populate the DOM with the wrapped pseudo-input
		this.wrapper.insertAfter(this.input);
		/* DOM binding routines. */
		this.bindFocusTagBoxInput();
		this.bindPickYear();
		this.bindPickMonth();
		this.bindPickDay();
		this.bindUpdateYear();
		this.bindUpdateMonth();
		this.bindUpdateDay();
		this.bindYearFuture();
		this.bindYearPast();

		return true;
	}
	;

	/**
	 * If the input has a value, build the date picker from that.
	 * 
	 * @param {Array} dateMatch
	 */
	DatePicker.prototype.insertDefaultDate = function (dateMatch){
		var month = /** @type {number} */(parseInt(dateMatch[1], 10) - 1),
				day = /** @type {string} */(dateMatch[2]),
				year = /** @type {string} */(dateMatch[3]),
				config = /** @type {Object} */(this.config.selected);

		if (year){
			config.year = parseInt(year, 10);
			this.insertTag('year', year, year);
		}

		if (month){
			config.month = month;
			this.insertTag('month', this.config.months[month], month);
		}

		if (day){
			config.day = parseInt(day, 10);
			this.insertTag('day', day, day);
		}
	};

	/**
	 * Prepends the years, months and/or days into pseudo-input.
	 *
	 * @param {jQuery} content
	 */
	DatePicker.prototype.insertDateChoice = function (content){
		this.wrapper.find('.dp_choice').remove();
		this.wrapper.append(content);
	};

	/**
	 * Will open the date choice based on what is already defined.
	 * 
	 * @return {void}
	 */
	DatePicker.prototype.showCorrectDateChoice = function (){
		var year = this.wrapper.find('.dp_tag.dp_tag_year'),
				month = this.wrapper.find('.dp_tag.dp_tag_month'),
				day = this.wrapper.find('.dp_tag.dp_tag_day');

		// Nothing chosen yet.
		if (year.length === 0){
			this.insertDateChoice(this.buildYearRange({
				start: this.config.year.start,
				end: this.config.year.end
			}));
			return;
		}
		// Year is already chosen.
		if (year.length && !month.length){
			this.insertDateChoice(this.buildMonths());
			return;
		}
		// Year and month are already chosen.
		if (year.length && month.length && !day.length){
			this.insertDateChoice(this.buildDays());
			return;
		}
		// Year, month and day are already chosen.
		if (year.length && month.length && day.length){
			this.insertDateChoice(this.buildDays());
			return;
		}
	};

	/**
	 * Build the list of years to choose from.
	 *
	 * @param {Object} range
	 * @return {string}
	 */
	DatePicker.prototype.buildYearRange = function (range){
		var div = ['<div class="dp_years dp_choice">'],
				start = /** @type {number} */(range.start),
				end = /** @type {number} */(range.end),
				diff = /** @type {number} */(end - start),
				arrows = /** @type {boolean} */(diff > 3 || this.config.year.infinite),
				i,
				className;

		// Up Arrow
		if (arrows){
			div.push('<span class="dp_pastYears dp_yearNav">&#x25B2;</span>');
		}

		div.push('<ol class="cols-' + diff + '">');

		// Build year list
		for (i = start; i < (end + 1); i++){
			className = i === this.config.currentYear ? ' dp_current' : '';
			div.push('<li class="dp_year' + className + '">' + i + '</li>');
		}

		div.push('</ol>');

		// Down Arrow
		if (arrows){
			div.push('<span class="dp_futureYears dp_yearNav">&#x25BC;</span>');
		}

		div.push('</div>');

		return div.join('');
	};

	/**
	 * Build the months to choose from.
	 *
	 * @return {string}
	 */
	DatePicker.prototype.buildMonths = function (){
		var months = this.config.months,
				div = ['<div class="dp_months dp_choice">'],
				month,
				classes = 'dp_month';

		div.push('<ol>');

		for (month in months){
			if (months.hasOwnProperty(month)){
				if (month === this.config.currentMonth && this.config.selected.year === this.config.currentYear){
					classes += " dp_current";
				}
				div.push('<li class="' + classes + '" data-month="' + month + '">' + months[month] + '</li>');
			}
		}

		div.push('</ol>');
		div.push('</div>');

		return div.join('');
	};

	/**
	 * Build the days to choose from.
	 * 
	 * @return {string}
	 */
	DatePicker.prototype.buildDays = function (){
		var days_in_each_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
				year = this.config.selected.year,
				month = this.config.selected.month,
				howManyDays = /** @type {number} */(days_in_each_month[month]),
				p,
				i,
				d,
				daysLeft,
				date = new Date(year, month, 1),
				day = date.getDay(),
				days = ['<div class="dp_choice dp_days">', '<table>', '<tr>'];

		// February Leap Year Check
		if (month === 1){
			if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0){
				howManyDays = 29;
			}
		}

		// Prepend Days of Week Headers
		days.push('<th>S</th>');
		days.push('<th>M</th>');
		days.push('<th>T</th>');
		days.push('<th>W</th>');
		days.push('<th>T</th>');
		days.push('<th>F</th>');
		days.push('<th>S</th>');

		days.push('</tr>');
		days.push('<tr>');

		// Prepend empty days
		for (p = 0; p < day; p++){
			days.push('<td class="dp_day dp_empty_day"></td>');
		}

		// Build days
		for (i = 1; i <= howManyDays; i++){
			if (i === this.config.currentDay
					&& this.config.selected.year === this.config.currentYear
					&& this.config.selected.month === this.config.currentMonth){
				days.push('<td class="dp_day dp_day_' + day + ' dp_current">' + i + '</td>');
			} else {
				days.push('<td class="dp_day dp_day_' + day + ' ">' + i + '</td>');
			}

			if (6 === day){
				day = 0;
				days.push('</tr>');
				if (i !== howManyDays){
					days.push('<tr>');
				}
			} else {
				day++;
			}
		}

		// Append empty days
		if (0 !== day){
			daysLeft = 7 - day;

			for (d = 0; d < daysLeft; d++){
				days.push('<td class="dp_day dp_empty_day"></td>');
			}
		}

		days.push('</tr>');
		days.push('</table>');
		days.push('</div>');

		return days.join('');
	};

	/**
	 * What happens when you focus (click) the dynamic input?
	 *
	 * @return {undefined}
	 */
	DatePicker.prototype.bindFocusTagBoxInput = function (){
		this.wrapper.on('click', '.dp_tagBox', function (){
			if (!this.wrapper.find('.dp_choice').length){
				this.showCorrectDateChoice();
			}
		}.bind(this));
	};

	/**
	 * What happens once you pick a year?
	 *
	 * @return {undefined}
	 */
	DatePicker.prototype.bindPickYear = function (){
		var config = /** @type {Object} */(this.config.selected);

		this.wrapper.on('click', '.dp_year', /** @param {Event} e */function (e){
			var year = /** @type {string} */($(e.target).text());

			config.year = year;
			this.insertTag('year', year, year);
			// After picking a year, build the months
			this.insertDateChoice(this.buildMonths());
			// Remove dependent tags
			this.wrapper.find('.dp_tag_month, .dp_tag_day').remove();
			// There is a real text input hidden out there.
			this.updateHiddenInput();
		}.bind(this));
	};

	/**
	 * Chooses a month.
	 */
	DatePicker.prototype.bindPickMonth = function (){
		var config = /** @type {Object} */(this.config.selected);

		this.wrapper.on('click', '.dp_month', /** @param {Event} e */function (e){
			var $el = /** @type {jQuery} */($(e.target)),
					month = /** @type {string} */($el.text()),
					monthValString = /** @type {string} */($el.data('month')),
					monthVal = /** @type {number} */(Number(monthValString) + 1);

			config.month = monthValString;
			this.insertTag('month', month, monthVal);
			// After picking a month, build the days.
			this.insertDateChoice(this.buildDays());
			// Remove dependent tags
			this.wrapper.find('.dp_tag_day').remove();
			// Put the value in the hidden input.
			this.updateHiddenInput();
		}.bind(this));
	};

	/**
	 * Chooses a day.
	 */
	DatePicker.prototype.bindPickDay = function (){
		var config = /** @type {Object} */(this.config.selected);

		this.wrapper.on('click', '.dp_day', /** @param {Event} e */function (e){
			var $el = /** @type {jQuery} */($(e.target)),
					day = /** @type {string} */($el.text());

			config.day = day;
			this.insertTag('day', day, day);
			// Remove dependent tags
			this.wrapper.find('.dp_choice').remove();
			// Put the value in the hidden input.
			this.updateHiddenInput();
		}.bind(this));
	};

	/**
	 * Modify the chosen year.
	 */
	DatePicker.prototype.bindUpdateYear = function (){
		/** @type {Object} */
		var yearConfig = this.config.year;

		this.wrapper.on('click', '.dp_tag_year', function (){
			var rangeChange = /** @type {number} */(yearConfig.rangeChange),
					newStart = /** @type {number} */(yearConfig.start) + rangeChange,
					newEnd = /** @type {number} */(yearConfig.end) + rangeChange;

			this.insertDateChoice(this.buildYearRange({start: newStart, end: newEnd}));
		}.bind(this));
	};

	/**
	 * Modify the chosen month.
	 */
	DatePicker.prototype.bindUpdateMonth = function (){
		this.wrapper.on('click', '.dp_tag_month', function (){
			// Build the months
			this.insertDateChoice(this.buildMonths());
		}.bind(this));
	};

	/**
	 * Modify the chosen day.
	 */
	DatePicker.prototype.bindUpdateDay = function (){
		this.wrapper.on('click', '.dp_tag_day', function (){
			// Build the days
			this.insertDateChoice(this.buildDays());
		}.bind(this));
	};

	/**
	 * Offset the range of years by a specified amount.
	 *
	 * @param {type} value The offset amount
	 * @returns {undefined}
	 */
	DatePicker.prototype.yearOffset = function (value){
		var newStart,
				newEnd,
				yearsString,
				yearConfig = /** @type {Object} */(this.config.year);

		yearConfig.rangeChange = /** @type {number} */(yearConfig.rangeChange) + value;
		newStart = /** @type {number} */(yearConfig.start) + /** @type {number} */(yearConfig.rangeChange);
		newEnd = /** @type {number} */(yearConfig.end) + /** @type {number} */(yearConfig.rangeChange);
		yearsString = /** @type {string} */(this.buildYearRange({start: newStart, end: newEnd}));

		this.insertDateChoice(yearsString);
	};

	/**
	 * Clicking on the future arrow increments the years.
	 */
	DatePicker.prototype.bindYearFuture = function (){
		this.wrapper.on('click', '.dp_futureYears', /** @param {Event} e */function (e){
			e.preventDefault();
			this.yearOffset(9);
		}.bind(this));
	};

	/**
	 * Clicking on the past arrow decrements the years.
	 */
	DatePicker.prototype.bindYearPast = function (){
		this.wrapper.on('click', '.dp_pastYears', /** @param {Event} e */function (e){
			e.preventDefault();
			this.yearOffset(-9);
		}.bind(this));
	};

	/**
	 * This updates the original input field's value for form submission.
	 */
	DatePicker.prototype.updateHiddenInput = function (){
		var input = /** @type {jQuery} */(this.input),
				value = '',
				order = this.config.order,
				valueSubmitted,
				i;

		for (i = 0; i < order.length; i++){
			valueSubmitted = /** @type {string} */($('.dp_tag_' + /** @type {string} */(order[i])).data('valuesubmitted'));
			value += valueSubmitted;
			if (i < 2){
				value += this.config.spacer;
			}
		}
		// This will replace the value with the selected date
		input.val(value);
	};

	/**
	 * There are some custom rules about placement in the DOM.
	 *
	 * @param {string} type The type of tag it is. (year, month, day)
	 * @param {string} valueDisplayed The value of the tag.
	 * @param {string|number} valueSubmitted The value of the tag submitted.
	 */
	DatePicker.prototype.insertTag = function (type, valueDisplayed, valueSubmitted){
		var tagBox = this.wrapper.find('.dp_tagBox'),
				tag = tagBox.find('.dp_tag.dp_tag_' + type),
				html = $('<span class="dp_tag dp_tag_' + type + '" data-valuesubmitted="' + valueSubmitted + '">' + valueDisplayed + '</span>'),
				year;

		if (tag.length){
			tag.text(valueDisplayed);
			return;
		}

		if (type === 'day'){
			year = this.wrapper.find('.dp_tag_year');
			html.insertBefore(year);
		} else {
			tagBox.prepend(html);
		}
	};

	/**
	 * Creates the pseudo-input.
	 * 
	 * @return {string} HTML for the tag box
	 */
	DatePicker.prototype.buildTagBox = function (){
		var classes = 'dp_wrapper ' + this.uniqueClass;

		if ('absolute' === this.config.position){
			classes += (' ' + this.config.position + ' ' + this.config.where);
		}

		return '<div class="' + classes + '"><div class="dp_tagBox"></div></div>';
	};

	/**
	 * Suppresses the original input field
	 */
	DatePicker.prototype.hideInput = function (){
		this.input.removeAttr('tabindex');
		this.input.hide();
	};

	/**
	 * jQuery Pluginify
	 * Only operates on input[type='date'] elements.
	 *
	 * @param {object} options
	 */
	$.fn.datepicker = function (options){
		return this.each(/** @param {Element} el */function (i, el){
			if (/** @type {string} */(el.nodeName) !== 'INPUT'
				|| /** @type {string} */(el.getAttribute('type')) !== "date"){
				return;
			}
			new DatePicker(el, options);
		});
	};
}(jQuery));