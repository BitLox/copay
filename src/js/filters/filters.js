'use strict';

angular.module('copayApp.filters', [])
  .filter('amTimeAgo', ['amMoment',
    function(amMoment) {
      return function(input) {
        return amMoment.preprocessDate(input).fromNow();
      };
    }
  ])
  .filter('paged', function() {
    return function(elements) {
      if (elements) {
        return elements.filter(Boolean);
      }

      return false;
    };
  })
  .filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
   }) 
  .filter('removeEmpty', function() {
    return function(elements) {
      elements = elements || [];
      // Hide empty change addresses from other copayers
      return elements.filter(function(e) {
        return !e.isChange || e.balance > 0;
      });
    }
  })
  .filter('formatFiatAmount', ['$filter', '$locale', 'configService',
    function(filter, locale, configService) {
      var numberFilter = filter('number');
      var formats = locale.NUMBER_FORMATS;
      var config = configService.getSync().wallet.settings;
      return function(amount) {
        if (!config) return amount;

        var fractionSize = 2;
        var value = numberFilter(amount, fractionSize);

        if (value === '0.00' && amount > 0) {
          value = '< 0.01';
        }

        var sep = value.indexOf(formats.DECIMAL_SEP);
        var group = value.indexOf(formats.GROUP_SEP);

        if (amount >= 0) {
          if (group > 0) {
            if (sep < 0) {
              return value;
            }
            var intValue = value.substring(0, sep);
            var floatValue = parseFloat(value.substring(sep));
            floatValue = floatValue.toFixed(2);
            floatValue = floatValue.toString().substring(1);
            var finalValue = intValue + floatValue;
            return finalValue;
          } else {
            return parseFloat(value);
          }
        }
        return 0;
      };
    }
  ])
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        filtered.push(item);
      });
      filtered.sort(function(a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if (reverse) filtered.reverse();
      return filtered;
    };
  })
  .filter('range', function() {
    return function(input, total) {
      total = parseInt(total);
      for (var i = 0; i < total; i++)
        input.push(i);
      return input;
    };
  }).filter('ellipses', 
    function() {
      return function(input,length) {
        return input.substring(0,length || 20)+"..."
      };
    }
  );
