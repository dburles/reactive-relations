Package.describe({
  summary: 'Intelligent reactive relational publications'
});

Package.on_use(function(api) {
  api.add_files('reactive-relations.js', ['client', 'server']);
});
