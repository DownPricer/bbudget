export const TIPS = [
  {
    title: "La règle des 48 h",
    body: "Avant un achat impulsif, ajoute-le à ta liste et attends 48 h.",
  },
  {
    title: "Liste avant le magasin",
    body: "Note ce dont tu as besoin avant d’entrer. Le reste peut attendre.",
  },
  {
    title: "Newsletters shopping",
    body: "Désabonne-toi des marques pour limiter les sollicitations.",
  },
  {
    title: "Carte enregistrée",
    body: "Supprime ta carte sur les sites de shopping pour freiner les achats impulsifs.",
  },
  {
    title: "Revendre le jamais porté",
    body: "Les articles non portés peuvent être revendus pour récupérer du budget.",
  },
  {
    title: "Échantillons cosmétiques",
    body: "Privilégie les formats voyage ou échantillons avant un achat complet.",
  },
  {
    title: "Réductions étudiantes",
    body: "Vérifie les tarifs étudiants (streaming, musées, transports).",
  },
  {
    title: "Sorties à moindre coût",
    body: "Musée gratuit, balade ou pique-nique : des options sans gros budget.",
  },
] as const;

export const CHALLENGE_TEMPLATES = [
  {
    title: "1 semaine sans achat de fringues",
    description: "Sept jours sans nouveau vêtement.",
    durationDays: 7,
  },
  {
    title: "0 commande en ligne ce week-end",
    description: "Samedi et dimanche sans panier en ligne.",
    durationDays: 2,
  },
  {
    title: "Une sortie gratuite cette semaine",
    description: "Au moins une activité à 0 € cette semaine.",
    durationDays: 7,
  },
  {
    title: "3 jours sans café à emporter",
    description: "Café préparé à la maison pendant 3 jours.",
    durationDays: 3,
  },
] as const;

export const SUBSCRIPTION_SUGGESTIONS = [
  { name: "Netflix", amount: 5.99, category: "Divertissement" },
  { name: "Spotify", amount: 5.99, category: "Divertissement" },
  { name: "Deezer", amount: 5.99, category: "Divertissement" },
  { name: "Disney+", amount: 9.99, category: "Divertissement" },
  { name: "Forfait téléphone", amount: 9.99, category: "Télécom" },
  { name: "Salle de sport", amount: 29.99, category: "Sport" },
  { name: "Amazon Prime", amount: 6.99, category: "Shopping" },
  { name: "iCloud", amount: 0.99, category: "Tech" },
] as const;
