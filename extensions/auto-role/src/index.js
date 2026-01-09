export default ({ filter }, { services, database, getSchema }) => {
  const { UsersService } = services;

  // Hook après création d'utilisateur
  filter('users.create', async (input, meta, context) => {
    // Si pas de rôle spécifié
    if (!input.role) {
      const schema = await getSchema();
      const service = new UsersService({ schema, accountability: context.accountability });

      try {
        // Récupérer le rôle "Authenticated User"
        const roles = await database('directus_roles')
          .where({ name: 'Authenticated User' })
          .first();

        if (roles && roles.id) {
          input.role = roles.id;
          console.log('Rôle attribué automatiquement:', roles.id);
        }
      } catch (error) {
        console.error('Erreur attribution rôle automatique:', error);
      }
    }

    return input;
  });
};
