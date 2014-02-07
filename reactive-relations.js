if (Meteor.isClient) {
  Meteor.subscribeReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    console.log('subscribing to ' + name);
    var handle = Meteor.subscribe(name);
    
    _.each(relations, function(relation) {
      console.log('loop: ' + relation.collection()._name);
      if (! relation.parentKey)
        relation.parentKey = '_id';

      var c = 0;
      Deps.autorun(function() {
        // why does this not make a difference
        if (handle.ready()) {
          console.log('subscribing to ' + relation.collection()._name + c);
          keyValues = mapper.cursor().map(function(doc) { return doc[relation.parentKey]; });
          
          Meteor.subscribe(name + '_' + relation.collection()._name, _.uniq(keyValues));
          c += 1;
        }
      });
    });
  };
}

if (Meteor.isServer) {
  Meteor.publishReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    Meteor.publish(name, function() {
      console.log('publishing ' + name);
      return mapper.cursor();
    });

    _.each(relations, function(relation) {
      if (! relation.key)
        relation.key = '_id';
      if (! relation.parentKey)
        relation.parentKey = '_id';

      Meteor.publish(name + '_' + relation.collection()._name, function(keyValues) {
        // on first subscribe, server resolves the relationships
        if (keyValues && keyValues.length === 0)
          keyValues = mapper.cursor().map(function(doc) { return doc[relation.parentKey]; });

        // build query
        if (! relation.query)
          relation.query = {};
        if (! relation.options)
          relation.options = {};

        relation.query[relation.key] = { $in: _.uniq(keyValues) };

        // console.log(relation.query, relation.options);

        return relation.collection().find(relation.query, relation.options);
      });
    });
  };
}
