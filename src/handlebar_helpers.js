'use strict';

function formatOSMType(sType, bExcludeExternal) {
  if (sType === 'N') return 'node';
  if (sType === 'W') return 'way';
  if (sType === 'R') return 'relation';

  if (!bExcludeExternal) return '';

  if (sType === 'T') return 'way';
  if (sType === 'I') return 'way';

  return '';
}

Handlebars.registerHelper({
  formatOSMType: function (sType, bExcludeExternal) {
    return formatOSMType(sType, bExcludeExternal);
  },
  shortOSMType: function (sType) {
    if (sType === 'node') return 'N';
    if (sType === 'way') return 'W';
    if (sType === 'relation') return 'R';
    return '';
  },
  // { osm_type: 'R', osm_id: 12345 }
  // <a href="https://www.openstreetmap.org/relation/12345">relation 12345</a
  osmLink: function (aPlace) {
    if (!aPlace.osm_type) return '';
    var sOSMType = formatOSMType(aPlace.osm_type, false);
    if (!sOSMType) return '';

    return new Handlebars.SafeString(
      '<a href="https://www.openstreetmap.org/' + sOSMType + '/' + aPlace.osm_id + '">' + sOSMType + ' ' + aPlace.osm_id + '</a>'
    );
  },
  /* en:London_Borough_of_Redbridge => https://en.wikipedia.org/wiki/London_Borough_of_Redbridge */
  wikipediaLink: function (aPlace) {
    if (!aPlace.calculated_wikipedia) return '';

    var parts = aPlace.calculated_wikipedia.split(':', 2);

    var sTitle = Handlebars.escapeExpression(aPlace.calculated_wikipedia);
    var sLanguage = Handlebars.escapeExpression(parts[0]);
    var sArticle = Handlebars.escapeExpression(parts[1]);

    return new Handlebars.SafeString(
      '<a href="https://' + sLanguage + '.wikipedia.org/wiki/' + sArticle + '" target="_blank">' + sTitle + '</a>'
    );
  },
  // { osm_type: 'R', osm_id: 12345 }
  // <a href="details.html?place_id=12345">details</a>
  detailsLink: function (aFeature, sTitle) {
    if (!aFeature) return '';
    if (!aFeature.place_id) return '';

    var sTitleEscaped = Handlebars.escapeExpression(sTitle || 'details >');

    return new Handlebars.SafeString(
      '<a href="details.html?place_id=' + aFeature.place_id + '">' + sTitleEscaped + '</a>'
    );
  },
  detailsPermaLink: function (aFeature, sTitle) {
    if (!aFeature) return '';

    var sOSMType = formatOSMType(aFeature.osm_type, false);
    if (!sOSMType) return '';

    var sTitleEscaped = Handlebars.escapeExpression(sTitle || sOSMType + ' ' + aFeature.osm_id);

    var sURL = 'details.html?osmtype=' + aFeature.osm_type + '&osmid=' + aFeature.osm_id;
    if (aFeature.category) {
      sURL = sURL + '&class=' + aFeature.category;
    }

    return new Handlebars.SafeString(
      '<a href="' + sURL + '">' + sTitleEscaped + '</a>'
    );
  },
  formatPlaceType: function (aPlace) {
    var sOut = aPlace.class + ':' + aPlace.type;
    if (aPlace.type && aPlace.type === 'administrative' && aPlace.place_type) {
      sOut = sOut + ' (' + aPlace.place_type + ')';
    }
    return new Handlebars.SafeString(sOut);
  },
  coverageType: function (aPlace) {
    return (aPlace.isarea ? 'Polygon' : 'Point');
  },
  // fDistance is in meters
  formatDistance: function (fDistanceMeters) {
    if (fDistanceMeters < 1) return '0';

    var formatted = (fDistanceMeters >= 1000)
      ? Math.round(fDistanceMeters / 1000, 1) + ' km'
      : Math.round(fDistanceMeters, 0) + ' m';

    return new Handlebars.SafeString(
      '<abbr class="distance" title="' + fDistanceMeters + '">~' + formatted + '</abbr>'
    );
  },
  // mark partial tokens (those starting with a space) with a star for readability
  formatKeywordToken: function (sToken) {
    return (sToken[0] === ' ' ? '*' : '') + Handlebars.escapeExpression(sToken);
  },
  // Any over 15 are invalid data in OSM anyway
  formatAdminLevel: function (iLevel) {
    return (iLevel < 15 ? iLevel : '');
  },
  formatMapIcon: function (sIcon) {
    if (!sIcon) return '';

    // https://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png
    // => poi boundary administrative
    var title = sIcon.replace(/.+\//, '').replace(/\..+/, '').replace(/_/g, ' ');
    // => http://localhost/mapicons/poi_boundary_administrative.p.20.png
    var url = get_config_value('Images_Base_Url') + sIcon.replace(/.+\//, '');

    return new Handlebars.SafeString(
      '<img class="mapicon" src="' + url + '" alt="' + title + '"/>'
    );
  },
  formatLabel: function (aPlace) {
    if (aPlace.label) return aPlace.label;

    function capitalize(s) {
      return s && s[0].toUpperCase() + s.slice(1);
    }

    if (aPlace.type && aPlace.type === 'yes' && aPlace.class) {
      return capitalize(aPlace.class.replace(/_/g, ' '));
    }
    if (aPlace.type) {
      return capitalize(aPlace.type.replace(/_/g, ' '));
    }
    return '';
  },
  formatSearchRank: function (iRank) {
    // same as
    // https://github.com/osm-search/Nominatim/blob/master/sql/functions.sql
    // get_searchrank_label()

    if (iRank < 2) return 'continent';
    if (iRank < 4) return 'sea';
    if (iRank < 8) return 'country';
    if (iRank < 12) return 'state';
    if (iRank < 16) return 'county';
    if (iRank === 16) return 'city';
    if (iRank === 17) return 'town / island';
    if (iRank === 18) return 'village / hamlet';
    if (iRank === 20) return 'suburb';
    if (iRank === 21) return 'postcode area';
    if (iRank === 22) return 'croft / farm / locality / islet';
    if (iRank === 23) return 'postcode area';
    if (iRank === 25) return 'postcode point';
    if (iRank === 26) return 'street / major landmark';
    if (iRank === 27) return 'minory street / path';
    if (iRank === 28) return 'house / building';
    return 'other: ' + iRank;
  },
  tooManyHierarchyLinesWarning: function (aPlace) {
    if (!aPlace.hierarchy) return '';

    var c = Object.keys(aPlace.hierarchy);
    if (c < 500) return '';

    return new Handlebars.SafeString(
      '<p>There are more child objects which are not shown.</p>'
    );
  },
  zoomLevels: function (iSelectedZoom) {
    var aZoomLevels = [
      /*  0 */ 'Continent / Sea',
      /*  1 */ '',
      /*  2 */ '',
      /*  3 */ 'Country',
      /*  4 */ '',
      /*  5 */ 'State',
      /*  6 */ 'Region',
      /*  7 */ '',
      /*  8 */ 'County',
      /*  9 */ '',
      /* 10 */ 'City',
      /* 11 */ '',
      /* 12 */ 'Town / Village',
      /* 13 */ '',
      /* 14 */ 'Suburb',
      /* 15 */ '',
      /* 16 */ 'Street',
      /* 17 */ '',
      /* 18 */ 'Building',
      /* 19 */ '',
      /* 20 */ '',
      /* 21 */ ''
    ];

    var select = $('<select>');
    var option = jQuery('<option>', { value: '', text: '--' });
    if (typeof (iSelectedZoom) === 'undefined') {
      option.attr('selected', 'selected');
    }
    option.appendTo(select);

    jQuery.each(aZoomLevels, function (i, title) {
      option = jQuery('<option>', { value: i, text: i + ' ' + title });
      if (i === iSelectedZoom) option.attr('selected', 'selected');
      option.appendTo(select);
    });
    return new Handlebars.SafeString(select.html());
  }
});
