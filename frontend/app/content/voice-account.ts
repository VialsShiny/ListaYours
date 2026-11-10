/**
 * Account page and header identity, in the same voice as the rest of the site.
 */
export const account = {
  roles: { owner: "Propriétaire", visitor: "Invité(e)" },
  eyebrow: "Toi",
  title: "Mon compte",
  intro: "Ce que je vois de toi, et ce que tu changes.",
  sections: { profile: "Qui tu es", photo: "Ta photo", password: "Mot de passe" },
  profile: {
    name: "Prénom ou surnom",
    email: "Adresse e-mail",
    save: "Enregistrer",
    saved: "C'est noté.",
    failed: "Ça n'a pas marché, réessaie.",
  },
  photo: {
    pick: "Choisis une photo",
    drop: "ou dépose-la ici",
    hint: "JPEG, PNG ou WebP, 2 Mo maximum. Je la recadre en carré.",
    preview: "Aperçu, avant d'enregistrer",
    current: "Ta photo actuelle",
    none: "Pas de photo, juste ton initiale.",
    save: "Enregistrer la photo",
    cancel: "Annuler",
    remove: "Retirer la photo",
    saved: "Photo enregistrée.",
    removed: "Photo retirée.",
    failed: "La photo n'est pas passée, réessaie.",
    wrongType: "Il me faut une image JPEG, PNG ou WebP.",
    tooHeavy: "Trop lourd, 2 Mo maximum.",
    unreadable: "Je n'arrive pas à lire cette image.",
  },
  password: {
    current: "Mot de passe actuel",
    next: "Nouveau mot de passe",
    hint: "Huit caractères, c'est tout.",
    save: "Changer le mot de passe",
    saved: "Mot de passe changé.",
    failed: "Ça n'a pas marché, réessaie.",
  },
  avatarAlt: (name: string) => `Photo de ${name}`,
  initialAlt: (name: string) => `Initiale de ${name}`,
} as const;
