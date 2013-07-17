/**
 * A new UI for picking dates
 *
 * @constructor
 *
 * @param {jQuery} input The input you want to make a date picker
 * @param {Object=} options Overide the config defaults if you want to.
 */
function DatePicker(input, options) {
    this.date = new Date();
    this.input  = /** @type {jQuery} */( $(input) );
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
        months: {
            '0': 'Jan',
            '1': 'Feb',
            '2': 'Mar',
            '3': 'Apr',
            '4': 'May',
            '5': 'Jun',
            '6': 'Jul',
            '7': 'Aug',
            '8': 'Sep',
            '9': 'Oct',
            '10': 'Nov',
            '11': 'Dec'
        },
        position: 'default',
        where: 'top',
        currentDay : this.date.getDate(),
        currentMonth : this.date.getMonth(),
        currentYear  : this.date.getFullYear()
    }
    this.uniqueClass = 'dp_input_' + Math.floor(Math.random()*11);
    this.wrapper     = undefined;

    $.extend({}, this.config, options);
}

/**
 * @return {undefined}
 */
DatePicker.start = function () {
   $(function(){
        $('.date-picker').each(/** @param {Element} el */function(i, el){
            if ( /** @type {string} */( el.nodeName ) !== 'INPUT' ) return;
            var elem = /** @type {jQuery} */( $(el) );
            var datePicker = new DatePicker(elem);
            datePicker.init();
        });
    });
}

/**
 * @return {boolean}
 */
DatePicker.prototype.init = function() {
    var inputExists = /** @type {number} */( this.input.length );

    if ( !inputExists ) return false;

    this.hideInput();

    var wrapper  = /** @type {string} */( this.buildTagBox() );
    this.wrapper = /** @type {jQuery} */( $(wrapper) );

    var defaultDate = this.input.val();

    if (defaultDate) {
        this.insertDefaultDate( defaultDate.match(/(\d+)-(\d+)-(\d+)/) );
    }

    this.wrapper.insertAfter(this.input);

    // Next: positioning

    this.bindFocusTagBoxInput();
    this.bindPickYear();
    this.bindPickMonth();
    this.bindPickDay();
    this.bindUpdateYear();
    this.bindUpdateMonth();
    this.bindUpdateDay();
    this.bindBackspaceTagBoxInput();
    this.bindBlurTagBoxInput();
    this.bindYearFuture();
    this.bindYearPast();

    return true;
}

/**
 * @param {Array} dateMatch
 * @return {undefined}
 */
DatePicker.prototype.insertDefaultDate = function(dateMatch) {
    var month  = /** @type {number} */(parseInt(dateMatch[1], 10) - 1),
        day    = /** @type {string} */(dateMatch[2]),
        year   = /** @type {string} */(dateMatch[3]),
        config = /** @type {Object} */(this.config.selected);

    if (year) {
        config.year = parseInt(year, 10);
        this.insertTag('year', year, year);
    }

    if (month) {
        config.month = month;
        this.insertTag('month', this.config.months[month], month);
    }

    if (day) {
        config.day = parseInt(day, 10);
        this.insertTag('day', day, day);
    }
}

/**
 * Prepends the years, months or days into wrapper.
 *
 * @param {jQuery} content
 * @return {undefined}
 */
DatePicker.prototype.insertDateChoice = function(content) {
    this.wrapper.find('.dp_choice').remove();

    this.wrapper.append(content);
}

/**
 * @return {undefined}
 */
DatePicker.prototype.showCorrectDateChoice = function() {
    var that    = this,
        year    = that.wrapper.find('.dp_tag.dp_tag_year'),
        month   = that.wrapper.find('.dp_tag.dp_tag_month'),
        day     = that.wrapper.find('.dp_tag.dp_tag_day'),
        choice;

    // Nothing choosen yet
    if ( year.size() == 0 ) {
        choice = $(/** @type {string} */( that.buildYearRange({
                    start: that.config.year.start,
                    end: that.config.year.end
                 })));

        that.insertDateChoice(choice);
        return;
    }

    // Year is already choosen
    if ( year.size() > 0 && month.size() == 0 ) {
        choice = $(/** @type {string} */( that.buildMonths() ));
        that.insertDateChoice(choice);
        return;
    }

    // Year and Month is already choosen
    if ( year.size() > 0 && month.size() > 0 && day.size() == 0 ) {
        choice = $(/** @type {string} */( that.buildDays() ));
        that.insertDateChoice(choice);
        return;
    }

    // Year, Month and day is already choosen
//    if ( year.size() > 0 && month.size() > 0 && day.size() > 0 ) {
//        choice = $(that.build.days());
//        that.insertDateChoice(choice);
//        return;
//    }

}

/**
 * Build the list of years to choose from.
 *
 * @param {Object} range
 * @return {string}
 */
DatePicker.prototype.buildYearRange = function(range) {
    var that      = /** @type {!DatePicker} */( this ),
        div       = ['<div class="dp_years dp_choice">'],
        start     = /** @type {number} */( range.start ),
        end       = /** @type {number} */( range.end ),
        diff      = /** @type {number} */( end - start ),
        arrows    = /** @type {boolean} */( diff > 3 || this.config.year.infinite ),
        width     = /** @type {boolean} */( false );

    if ( arrows ) {
        div.push('<span class="dp_pastYears dp_yearNav">▲</span>');
    }

    div.push('<ol class="cols-' + diff + '">');

    // Build year list
    for ( var i=start; i<(end + 1); i++ ) {
        var className = i == this.config.currentYear ? ' dp_current' : '';
        div.push('<li class="dp_year' + className + '">' + i + '</li>');
    }

    div.push('</ol>');

    if ( arrows ) {
        div.push('<span class="dp_futureYears dp_yearNav">▼</span>');
    }

    div.push('</div>');

    return div.join('');
}

/**
 * Build the months to pick from.
 *
 * @return {string}
 */
DatePicker.prototype.buildMonths = function() {
    var that   = /** @type {!DatePicker} */( this ),
        months = that.config.months,
        div    = ['<div class="dp_months dp_choice">'];

    div.push('<ol>');

    for ( var month in months ) {
        if ( months.hasOwnProperty(month) ) {
            var current = /** @type {boolean} */(
                month == that.config.currentMonth
                && that.config.selected.year == that.config.currentYear
            );
            var monthText = /** @type {string} */( months[month] );
            if (current) {
                div.push('<li class="dp_month dp_current" data-month="' + month + '">' + monthText + '</li>');
            }
            else {
                div.push('<li class="dp_month" data-month="' + month + '">' + monthText + '</li>');
            }
        }
    }

    div.push('</ol>');

    div.push('</div>');

    return div.join('');
}

/**
 * @return {string}
 */
DatePicker.prototype.buildDays = function() {
    var that               = /** @type {!DatePicker} */( this ),
        days_in_each_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        year               = that.config.selected.year,
        month              = that.config.selected.month,
        howManyDays        = /** @type {number} */( days_in_each_month[month] );

    // February Leap Year Check
    if ( month == 1 ) {
        if ( (year % 4 == 0 && year % 100 != 0) || year % 400 == 0 ) {
            howManyDays = 29;
        }
    }

    var date = new Date(year, month, 1),
        day  = date.getDay(),
        days = ['<div class="dp_choice dp_days">', '<table>', '<tr>'];

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
    for ( var p=0; p<day; p++ ) {
        days.push('<td class="dp_day dp_empty_day"></td>');
    }

    // Build days
    for ( var i=1; i<=howManyDays; i++ ) {
        if(i == that.config.currentDay
            && that.config.selected.year == that.config.currentYear
            && that.config.selected.month == that.config.currentMonth) {
           days.push('<td class="dp_day dp_day_' + day + ' dp_current">' + i + '</td>');
        }
        else {
            days.push('<td class="dp_day dp_day_' + day + ' ">' + i + '</td>');
        }

        if ( 6 == day ) {
            day = 0;
            days.push('</tr>');
            if (i != howManyDays) {
                days.push('<tr>');
            }
        } else {
            day++;
        }
    }

    // Append empty days
    if ( 0 != day ) {
        var daysLeft = 7-day;

        for ( var d=0; d<daysLeft; d++) {
            days.push('<td class="dp_day dp_empty_day"></td>');
        }
    }

    days.push('</tr>');
    days.push('</table>');
    days.push('</div>');

    return days.join('');
}

/**
 * What happens when you focus the dynamic input?
 *
 * @return {undefined}
 */
DatePicker.prototype.bindFocusTagBoxInput = function() {
    this.wrapper.on('click', '.dp_tagBox', function() {
        var that = /** @type {!DatePicker} */( this );
        if ( that.wrapper.find('.dp_choice').size() == 0 ) {
            that.showCorrectDateChoice();
        }
    }.bind(this));
}

/**
 * What happens when you blur the dynamic input?
 *
 * @return {undefined}
 */
DatePicker.prototype.bindBlurTagBoxInput = function() {
    this.wrapper.on('blur', 'input', function() {
        //var that = /** @type {!DatePicker} */( this );
        //that.wrapper.find('.dp_choice').remove();
    }.bind(this));
}

/**
 * What happens once you pick a year?
 *
 * @return {undefined}
 */
DatePicker.prototype.bindPickYear = function() {
    var config = /** @type {Object} */( this.config.selected );

    this.wrapper.on('click', '.dp_year', /** @param {Event} e */function(e) {
        var that = /** @type {!DatePicker} */( this ),
            el   = /** @type {HTMLElement} */( e.target ),
            $el  = /** @type {jQuery} */( $(el) ),
            year = /** @type {string} */( $el.text() );

        that.insertTag('year', year, year);
        config.year = year;

        // Build the months after picking a year
        var monthsString = /** @type {string} */( that.buildMonths() ),
            months       = /** @type {jQuery} */( $(monthsString) );

        that.insertDateChoice(months);

        // Remove dependant tags
        that.wrapper.find('.dp_tag_month, .dp_tag_day').remove();

        that.updateHiddenInput();
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindPickMonth = function() {
    var config = /** @type {Object} */( this.config.selected );

    this.wrapper.on('click', '.dp_month', /** @param {Event} e */function(e) {
        var that           = /** @type {!DatePicker} */( this ),
            el             = /** @type {HTMLElement} */( e.target ),
            $el            = /** @type {jQuery} */( $(el) ),
            month          = /** @type {string} */( $el.text() ),
            monthValString = /** @type {string} */( $el.data('month') ),
            monthVal       = /** @type {number} */( Number(monthValString) + 1 );

        that.insertTag('month', month, monthVal);
        config.month = monthValString;

        // Build the days after picking a month
        var daysString = /** @type {string} */( that.buildDays() ),
            days       = /** @type {jQuery} */( $(daysString) );

        that.insertDateChoice(days);

        // Remove dependant tags
        that.wrapper.find('.dp_tag_day').remove();

        that.updateHiddenInput();
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindPickDay = function() {
    var config = /** @type {Object} */( this.config.selected );

    this.wrapper.on('click', '.dp_day', /** @param {Event} e */function(e) {
        var that = /** @type {!DatePicker} */( this ),
            el   = /** @type {HTMLElement} */( e.target ),
            $el  = /** @type {jQuery} */( $(el) ),
            day  = /** @type {string} */( $el.text() );

        that.insertTag('day', day, day);
        config.day = day;

        that.updateHiddenInput();
        that.wrapper.find('.dp_choice').remove();
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindUpdateYear = function() {
    var config     = /** @type {Object} */( this.config ),
        yearConfig = /** @type {Object} */( config.year );

    this.wrapper.on('click', '.dp_tag_year', function() {
        var that        = /** @type {!DatePicker} */( this ),
            rangeChange = /** @type {number} */( yearConfig.rangeChange ),
            newStart    = /** @type {number} */( yearConfig.start ) + rangeChange,
            newEnd      = /** @type {number} */( yearConfig.end )+ rangeChange,
            yearsString = /** @type {string} */( that.buildYearRange({start: newStart, end: newEnd}) ),
            years       = /** @type {jQuery} */( $(yearsString) );

        that.insertDateChoice(years);
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindUpdateMonth = function() {
    this.wrapper.on('click', '.dp_tag_month', function() {
        // Build the days
        var that         = /** @type {!DatePicker} */( this ),
            monthsString = /** @type {string} */( that.buildMonths() ),
            months       = /** @type {jQuery} */( $(monthsString) );

        that.insertDateChoice(months);
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindUpdateDay = function() {
    this.wrapper.on('click', '.dp_tag_day', function() {
        // Build the days
        var that       = /** @type {!DatePicker} */( this ),
            daysString = /** @type {string} */( that.buildDays() ),
            days       = /** @type {jQuery} */( $(daysString) );

        that.insertDateChoice(days);
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindBackspaceTagBoxInput = function() {
    this.wrapper.on('keyup', 'input', /** @param {Event} e */function(e) {
        var that      = /** @type {!DatePicker} */( this ),
            key       = /** @type {number} */( e.keyCode ),
            backspace = 8;

        if ( key == backspace ) {
            that.wrapper.find('.dp_tag:first').remove();
            that.showCorrectDateChoice();
            that.updateHiddenInput();
        }
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindYearFuture = function() {
    var yearConfig = /** @type {Object} */( this.config.year );

    this.wrapper.on('click', '.dp_futureYears', /** @param {Event} e */function(e) {
        e.preventDefault();
        yearConfig.rangeChange = /** @type {number} */( yearConfig.rangeChange ) + 9;

        var that        = /** @type {!DatePicker} */( this ),
            newStart    = /** @type {number} */( yearConfig.start ) + /** @type {number} */( yearConfig.rangeChange ),
            newEnd      = /** @type {number} */( yearConfig.end ) + /** @type {number} */( yearConfig.rangeChange ),
            yearsString = /** @type {string} */( that.buildYearRange({start: newStart, end: newEnd}) ),
            years       = /** @type {jQuery} */( $(yearsString) );

        that.insertDateChoice(years);
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.bindYearPast = function() {
    var yearConfig = /** @type {Object} */( this.config.year );

    this.wrapper.on('click', '.dp_pastYears', /** @param {Event} e */function(e) {
        e.preventDefault();
        yearConfig.rangeChange = /** @type {number} */( yearConfig.rangeChange ) - 9;

        var that        = /** @type {!DatePicker} */( this ),
            newStart    = /** @type {number} */( yearConfig.start ) + /** @type {number} */( yearConfig.rangeChange ),
            newEnd      = /** @type {number} */( yearConfig.end ) + /** @type {number} */( yearConfig.rangeChange ),
            yearsString = /** @type {string} */( that.buildYearRange({start: newStart, end: newEnd}) ),
            years       = /** @type {jQuery} */( $(yearsString) );

        that.insertDateChoice(years);
    }.bind(this));
}

/**
 * @return {undefined}
 */
DatePicker.prototype.updateHiddenInput = function() {
    var that  = this,
        input = /** @type {jQuery} */( that.input ),
        tag   = that.wrapper.find('.dp_tag'),
        value = '',
        order = that.config.order;

    input.val('');

    for ( var i=0; i<order.length; i++ ) {
        var valueSubmitted = /** @type {string} */( $('.dp_tag_' + /** @type {string} */( order[i] )).data('valuesubmitted') );
        value += valueSubmitted;
        if ( i < 2 ) value += that.config.spacer;
    }

    input.val(value);
}

/**
 * @param {string} type The type of tag it is. (year, month, day)
 * @param {string} valueDisplayed The value of the tag.
 * @param {string|number} valueSubmitted The value of the tag submitted.
 * @return {undefined}
 */
DatePicker.prototype.insertTag = function(type, valueDisplayed, valueSubmitted) {
    var that   = this,
        tagBox = that.wrapper.find('.dp_tagBox'),
        tag    = tagBox.find('.dp_tag.dp_tag_' + type),
        html   = $('<span class="dp_tag dp_tag_' + type + '" data-valuesubmitted="' + valueSubmitted + '">' + valueDisplayed + '</span>');

    if ( tag.size() > 0 ) {
        tag.text(valueDisplayed);
        return;
    }

    if ( type === 'day' ) {
        var year = that.wrapper.find('.dp_tag_year');
        html.insertBefore(year);
    } else {
        tagBox.prepend(html);
    }
}

/**
 * @return {string}
 */
DatePicker.prototype.buildTagBox = function() {
    var classes = 'dp_wrapper ' + this.uniqueClass,
        config  = this.config;

    if ( 'absolute' == config.position ) {
        classes += (' ' + config.position + ' ' + config.where);
    }

    var div = '<div class="' + classes + '"><div class="dp_tagBox"></div></div>';

    return div;
}

/**
 * @return {undefined}
 */
DatePicker.prototype.hideInput = function() {
    var input = /** @type {jQuery} */( this.input );
    input.removeAttr('tabindex');
    input.hide();
}
