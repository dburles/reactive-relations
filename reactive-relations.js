if (Meteor.isClient) {
  Meteor.subscribeReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    Deps.autorun(function() {
      var keyValues = {};

      _.each(relations, function(relation) {
        if (! relation.parentKey)
          relation.parentKey = '_id';

        keyValues[relation.parentKey] = mapper.cursor().map(function(doc) { return doc[relation.parentKey]; });
      });

      // console.log('subscribing with ', keyValues);
      Meteor.subscribe(name, keyValues);
    });
  };
}

if (Meteor.isServer) {
  Meteor.publishReactive = function(name) {
    Meteor.publish(name, function(keyValues) {
      var mapper = Reactive[name];
      var relations = mapper.relations;
      var relationCursors = [];

      // console.log(keyValues);

      _.each(relations, function(relation) {
        if (! relation.parentKey)
          relation.parentKey = '_id';

        // on first subscribe, server resolves the relationships
        if (keyValues[relation.parentKey] && keyValues[relation.parentKey].length === 0)
          keyValues[relation.parentKey] = mapper.cursor().map(function(doc) { return doc[relation.parentKey]; });

        // build query
        if (! relation.key)
          relation.key = '_id';
        if (! relation.query)
          relation.query = {};
        if (! relation.options)
          relation.options = {};

        // manually pass in things to join on
        if (relation.map) {
          if (! relation.map.key)
            relation.map.key = '_id';
          relation.query[relation.map.key] = { $in: relation.map.values() };
        } else {
          relation.query[relation.key] = { $in: keyValues[relation.parentKey] };
        }

        // console.log(relation.query, relation.options);

        relationCursors.push(relation.collection().find(relation.query, relation.options));
      });

      return [
        mapper.cursor(),
      ].concat(relationCursors);
    });
  };
}
