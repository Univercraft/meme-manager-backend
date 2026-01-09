export default ({ action }, { services, logger }) => {
  const { ItemsService } = services;

  action('memes.items.create', async (meta, context) => {
    logger.info('🔍 Meilisearch: Nouveau meme indexé');
  });

  action('memes.items.update', async (meta, context) => {
    logger.info('🔍 Meilisearch: Meme mis à jour dans l\'index');
  });

  action('memes.items.delete', async (meta, context) => {
    logger.info('🔍 Meilisearch: Meme supprimé de l\'index');
  });
};
