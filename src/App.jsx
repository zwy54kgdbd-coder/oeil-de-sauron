import "./App.css";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const initialUsers = [];

const CREATE_NEW_IDENTITY = "__CREATE_NEW_IDENTITY__";

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const fakePeople = [];

function getAge(dateNaissance) {
  if (!dateNaissance) return "";

  const birth = new Date(dateNaissance);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function getNomVehicule(vehicule) {
  const marqueModele = `${vehicule.marque || ""} ${vehicule.modele || ""}`.trim();

  if (vehicule.plaque) {
    return `${marqueModele} — ${vehicule.plaque}`;
  }

  return marqueModele || "Véhicule sans précision";
}

function getNomIdentite(identites, individuId) {
  const person = identites.find((item) => String(item.id) === String(individuId));
  if (!person) return "";
  return `${person.nom || ""} ${person.prenom || ""}`.trim();
}

function getLibelleIdentite(person) {
  if (!person) return "Identité inconnue";

  return (
    `${person.nom || ""} ${person.prenom || ""}`.trim() ||
    person.alias ||
    "Identité sans nom"
  );
}

function getIdentite(identites, individuId) {
  return identites.find((item) => String(item.id) === String(individuId));
}

function uniquePhotos(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizePhotos(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  const parsed = safeParseArray(value);
  return parsed.length > 0 ? parsed : [value];
}

function getPhotos(person) {
  return uniquePhotos([
    ...normalizePhotos(person.photos),
    person.photo,
    person.photo_url,
    person.photoUrl,
    person.image,
    person.image_url,
  ]);
}

function getPhotoPrincipale(person) {
  const photos = getPhotos(person);
  const index =
    person.photo_principale_index ?? person.photoPrincipaleIndex ?? 0;

  return photos[index] || photos[0] || person.photo || "";
}

function formatDateFr(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR");
}

function formatHeureFr(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("fr-FR");
}

function PhotoZoomOverlay({ photoZoom, onClose }) {
  if (!photoZoom) return null;

  return (
    <div className="photo-zoom-overlay" onClick={onClose}>
      <img
        src={photoZoom}
        alt="zoom"
        className="photo-zoom-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function App() {
  const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [session, setSession] = useState(null);
  const [logged, setLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("home");

  
  const [users, setUsers] = useState(initialUsers);
  useEffect(() => {
  chargerUtilisateurs();

  const channelUsers = supabase
    .channel("users-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "users",
      },
      () => {
        chargerUtilisateurs();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channelUsers);
  };
}, []);
const chargerUtilisateurs = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  if (error) {
    console.log("ERREUR USERS :", error);
    return;
  }

  setUsers(data || []);
};
  const [editingUser, setEditingUser] = useState(null);

  const [newGrade, setNewGrade] = useState("");
  const [newNom, setNewNom] = useState("");
  const [newPrenom, setNewPrenom] = useState("");
  const [newMatricule, setNewMatricule] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("MEMBRE");

  const [identites, setIdentites] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [faitsIdentites, setFaitsIdentites] = useState([]);
  const [historique, setHistorique] = useState([]);

  const [editingVehiculeId, setEditingVehiculeId] = useState(null);
  const [vehiculeMarque, setVehiculeMarque] = useState("");
  const [vehiculeModele, setVehiculeModele] = useState("");
  const [vehiculeCouleur, setVehiculeCouleur] = useState("");
  const [vehiculePlaque, setVehiculePlaque] = useState("");
  const [vehiculeSecteur, setVehiculeSecteur] = useState("");
  const [vehiculeFaits, setVehiculeFaits] = useState("");
  const [vehiculeFuite, setVehiculeFuite] = useState("");
  const [vehiculeObservations, setVehiculeObservations] = useState("");
  const [vehiculeIndividuId, setVehiculeIndividuId] = useState("");
const [vehiculePhoto, setVehiculePhoto] = useState("");
const [vehiculePhotos, setVehiculePhotos] = useState([]);
const [vehiculePhotoPrincipaleIndex, setVehiculePhotoPrincipaleIndex] = useState(0);
  const [nouvelleIdentiteNom, setNouvelleIdentiteNom] = useState("");
  const [nouvelleIdentitePrenom, setNouvelleIdentitePrenom] = useState("");
  const [nouvelleIdentiteAlias, setNouvelleIdentiteAlias] = useState("");
  const [nouvelleIdentiteNaissance, setNouvelleIdentiteNaissance] = useState("");
  const [nouvelleIdentiteLieuNaissance, setNouvelleIdentiteLieuNaissance] = useState("");
const [nouvelleIdentiteDomicile, setNouvelleIdentiteDomicile] = useState("");
const [nouvelleIdentiteTelephone, setNouvelleIdentiteTelephone] = useState("");
  const [nouvelleIdentiteSecteur, setNouvelleIdentiteSecteur] = useState("");
  const [nouvelleIdentiteFaits, setNouvelleIdentiteFaits] = useState("");
  const [nouvelleIdentiteObservations, setNouvelleIdentiteObservations] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [rechercheSecteur, setRechercheSecteur] = useState("");
  const [typeSecteur, setTypeSecteur] = useState("habituel");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [alias, setAlias] = useState("");
  const [naissance, setNaissance] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
const [domicile, setDomicile] = useState("");
const [telephone, setTelephone] = useState("");
  const [secteur, setSecteur] = useState("");
  const [faits, setFaits] = useState("");
  const [vehicule, setVehicule] = useState("");
  const [observations, setObservations] = useState("");
  const [photo, setPhoto] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPrincipaleIndex, setPhotoPrincipaleIndex] = useState(0);
  const [photoZoom, setPhotoZoom] = useState("");
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [identityDetailsReturnPage, setIdentityDetailsReturnPage] = useState("search");
const [selectedVehicle, setSelectedVehicle] = useState(null);
const [vehicleDetailsReturnPage, setVehicleDetailsReturnPage] = useState("vehicules");
  const [nouveauFaitDate, setNouveauFaitDate] = useState("");
  const [nouveauFaitDescription, setNouveauFaitDescription] = useState("");
    useEffect(() => {
  chargerIdentites();
  chargerVehicules();
  chargerFaitsIdentites();
  chargerJournalModifications();

  const identitesChannel = supabase
    .channel("realtime-identites")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "identites",
      },
      () => {
        chargerIdentites();
      }
    )
    .subscribe();

  const vehiculesChannel = supabase
    .channel("realtime-vehicules")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vehicules",
      },
      () => {
        chargerVehicules();
      }
    )
    .subscribe();

  const faitsIdentitesChannel = supabase
    .channel("realtime-faits-identites")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "faits_identites",
      },
      () => {
        chargerFaitsIdentites();
      }
    )
    .subscribe();

  const journalModificationsChannel = supabase
    .channel("realtime-journal-modifications")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "journal_modifications",
      },
      () => {
        chargerJournalModifications();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(identitesChannel);
    supabase.removeChannel(vehiculesChannel);
    supabase.removeChannel(faitsIdentitesChannel);
    supabase.removeChannel(journalModificationsChannel);
  };
}, []);

  const chargerIdentites = async () => {
  const { data, error } = await supabase
    .from("identites")
    .select("*");

  if (error) {
    console.log("ERREUR SUPABASE :", error);
    return;
  }
const chargerVehicules = async () => {
  const { data, error } = await supabase
    .from("vehicules")
    .select("*");

  if (error) {
    console.log("ERREUR VEHICULES :", error);
    return;
  }

  setVehicules(data || []);
};
  setIdentites(data || []);
};
const chargerVehicules = async () => {
  const { data, error } = await supabase
    .from("vehicules")
    .select("*");

  if (error) {
    console.log("ERREUR VEHICULES :", error);
    return;
  }

  const vehiculesFormates = (data || []).map((item) => ({
  id: item.id,
  marque: item.marque || "",
  modele: item.modele || "",
  couleur: item.couleur || "",
  plaque: item.immatriculation || "",
  secteur: item.secteur || "",
  faits: item.faits || "",
  fuite: item.fuite || "",
  observations: item.observations || "",
  individuId: item.identite || "",

  photo: item.photo || "",
  photos: item.photos || [],
  photo_principale_index:
    item.photo_principale_index || 0,
  favori_bac: item.favori_bac || false,
}));

  setVehicules(vehiculesFormates);
};

const chargerFaitsIdentites = async () => {
  const { data, error } = await supabase
    .from("faits_identites")
    .select("*")
    .order("date_fait", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR FAITS IDENTITÉS :", error);
    return;
  }

  setFaitsIdentites(data || []);
};

const ajouterFaitIdentite = async (identiteId) => {
  if (!nouveauFaitDate || !nouveauFaitDescription.trim()) {
    alert("Renseigne une date et un fait.");
    return;
  }

  const identite = getIdentite(identites, identiteId);
  const libelleIdentite = getLibelleIdentite(identite);
  const descriptionFait = nouveauFaitDescription.trim();

  const { error } = await supabase.from("faits_identites").insert([
    {
      identite_id: identiteId,
      date_fait: nouveauFaitDate,
      description: descriptionFait,
      created_by: currentUser?.username || "",
    },
  ]);

  if (error) {
    alert("Erreur ajout fait : " + error.message);
    return;
  }

  setNouveauFaitDate("");
  setNouveauFaitDescription("");
  await chargerFaitsIdentites();
  ajouterHistorique(
    `Ajout fait sur : ${libelleIdentite} — ${descriptionFait}`,
    "fait_identite",
    identiteId
  );
};

const supprimerFaitIdentite = async (id) => {
  const fait = faitsIdentites.find((item) => String(item.id) === String(id));
  const identite = fait ? getIdentite(identites, fait.identite_id) : null;
  const libelleIdentite = getLibelleIdentite(identite);

  const confirmation = window.confirm("Supprimer ce fait ?");

  if (!confirmation) return;

  const { error } = await supabase
    .from("faits_identites")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur suppression fait : " + error.message);
    return;
  }

  await chargerFaitsIdentites();
  ajouterHistorique(
    `Suppression fait sur : ${libelleIdentite}${fait?.description ? ` — ${fait.description}` : ""}`,
    "fait_identite",
    fait?.identite_id || id
  );
};

const chargerJournalModifications = async () => {
  const { data, error } = await supabase
    .from("journal_modifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR JOURNAL MODIFICATIONS :", error);
    return;
  }

  setHistorique(data || []);
};

  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
  };

  const saveIdentites = (updatedIdentites) => {
    setIdentites(updatedIdentites);
    localStorage.setItem("identites", JSON.stringify(updatedIdentites));
  };

  const saveVehicules = (updatedVehicules) => {
    setVehicules(updatedVehicules);
    localStorage.setItem("vehicules", JSON.stringify(updatedVehicules));
  };

  const ajouterHistorique = async (action, typeObjet = "", objetId = null) => {
    const { error } = await supabase.from("journal_modifications").insert([
      {
        username: currentUser?.username || "Inconnu",
        action,
        type_objet: typeObjet,
        objet_id: objetId ? String(objetId) : null,
        details: action,
      },
    ]);

    if (error) {
      console.log("ERREUR AJOUT JOURNAL :", error);
      return;
    }

    await chargerJournalModifications();
  };

  const basculerFavoriIdentite = async (person) => {
    const nouveauStatut = !person.favori_bac;

    const { error } = await supabase
      .from("identites")
      .update({ favori_bac: nouveauStatut })
      .eq("id", person.id);

    if (error) {
      alert("Erreur favori identité : " + error.message);
      return;
    }

    const identiteMaj = { ...person, favori_bac: nouveauStatut };
    setSelectedIdentity((current) =>
      current && String(current.id) === String(person.id) ? identiteMaj : current
    );
    await chargerIdentites();
    ajouterHistorique(
      `${nouveauStatut ? "Épinglage" : "Retrait favori"} identité BAC : ${getLibelleIdentite(person)}`,
      "identite",
      person.id
    );
  };

  const basculerFavoriVehicule = async (item) => {
    const nouveauStatut = !item.favori_bac;

    const { error } = await supabase
      .from("vehicules")
      .update({ favori_bac: nouveauStatut })
      .eq("id", item.id);

    if (error) {
      alert("Erreur favori véhicule : " + error.message);
      return;
    }

    const vehiculeMaj = { ...item, favori_bac: nouveauStatut };
    setSelectedVehicle((current) =>
      current && String(current.id) === String(item.id) ? vehiculeMaj : current
    );
    await chargerVehicules();
    ajouterHistorique(
      `${nouveauStatut ? "Épinglage" : "Retrait favori"} véhicule BAC : ${getNomVehicule(item)}`,
      "vehicule",
      item.id
    );
  };

  const viderHistorique = async () => {
    if (currentUser?.role !== "LE TÔLIER") {
      alert("Seul le Tôlier peut vider l'historique.");
      return;
    }

    const confirmation = confirm(
      "Confirmer la suppression complète de l'historique ?"
    );

    if (!confirmation) return;

    const { error } = await supabase
      .from("journal_modifications")
      .delete()
      .neq("id", 0);

    if (error) {
      alert("Erreur suppression historique : " + error.message);
      return;
    }

    setHistorique([]);
  };

 const connexion = async () => {
  if (!username || !password) {
    alert("Renseigne l'identifiant et le mot de passe.");
    return;
  }

  const loginClean = username.trim().toLowerCase();

const { data: profil, error: profilError } = await supabase
  .from("users")
  .select("*")
  .eq("username", loginClean)
  .single();

if (profilError) {
  alert("Profil utilisateur introuvable.");
  return;
}

const email =
  profil.auth_email ||
  (loginClean === "tolier"
    ? "tayeb.berkouk.tbt@gmail.com"
    : `${loginClean}@oeildesauron.com`);

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

  if (error) {
    alert("Identifiant ou mot de passe incorrect.");
    return;
  }

  

  setSession(data.session);
  setCurrentUser(profil);
  setLogged(true);
  setPage("home");
};

  const deconnexion = async () => {
  await supabase.auth.signOut();

  setLogged(false);
  setCurrentUser(null);
  setSession(null);
  setUsername("");
  setPassword("");
  setPage("home");
};

  const resetIdentityForm = () => {
    setEditingId(null);
    setNom("");
    setPrenom("");
    setAlias("");
    setNaissance("");
    setLieuNaissance("");
setDomicile("");
setTelephone("");
    setSecteur("");
    setFaits("");
    setVehicule("");
    setObservations("");
    setPhoto("");
    setPhotos([]);
    setPhotoPrincipaleIndex(0);
  };

  const enregistrerIdentite = async () => {
  if (!nom && !prenom && !alias) {
    alert("Renseigne au moins un nom, un prénom ou un alias.");
    return;
  }

  const photoPrincipale = photos[photoPrincipaleIndex] || photo || "";
  const photosUniques = uniquePhotos([photoPrincipale, ...photos]);

  const fiche = {
    nom,
    prenom,
    alias,
    naissance,
    lieu_naissance: lieuNaissance,
domicile,
telephone,
    secteur,
    faits,
    vehicule: "",
    observations,
    photo: photoPrincipale,
    photos: photosUniques,
	photo_principale_index: photoPrincipale ? 0 : photoPrincipaleIndex,
  };

  let result;

  if (editingId) {
    result = await supabase
      .from("identites")
      .update(fiche)
      .eq("id", editingId)
      .select();
  } else {
    result = await supabase
      .from("identites")
      .insert([fiche])
      .select();
  }

  if (result.error) {
    console.log("ERREUR ENREGISTREMENT IDENTITÉ :", result.error);
    alert("Erreur lors de l'enregistrement dans Supabase.");
    return;
  }

  await chargerIdentites();

  const identiteEnregistree = result.data?.[0];
  const identiteId = editingId || identiteEnregistree?.id;
  const libelleIdentite = getLibelleIdentite({
    nom,
    prenom,
    alias,
  });

  ajouterHistorique(
    editingId
      ? `Modification identité : ${libelleIdentite}`
      : `Création identité : ${libelleIdentite}`,
    "identite",
    identiteId
  );

  resetIdentityForm();
  setPage("search");
};

  const modifierIdentite = (person) => {
    if (String(person.id).startsWith("fake")) {
      alert("Fiche test non modifiable.");
      return;
    }

    setEditingId(person.id);
    setNom(person.nom || "");
    setPrenom(person.prenom || "");
    setAlias(person.alias || "");
    setNaissance(person.naissance || "");
    setLieuNaissance(person.lieu_naissance || "");
setDomicile(person.domicile || "");
setTelephone(person.telephone || "");
    setSecteur(person.secteur || "");
    setFaits(person.faits || "");
    setVehicule("");
    setObservations(person.observations || "");

    const loadedPhotos = getPhotos(person);
    const loadedIndex =
  person.photo_principale_index ?? person.photoPrincipaleIndex ?? 0;

    setPhotos(loadedPhotos);
    setPhotoPrincipaleIndex(loadedIndex);
    setPhoto(loadedPhotos[loadedIndex] || loadedPhotos[0] || "");
    setPage("add");
  };

  const supprimerIdentite = async (id) => {
  if (String(id).startsWith("fake")) {
    alert("Fiche test non supprimable.");
    return;
  }

  const confirmation = window.confirm(
    "Confirmer la suppression de cette identité ?"
  );

  if (!confirmation) return;

  const identiteSupprimee = identites.find((item) => String(item.id) === String(id));
  const libelleIdentite = getLibelleIdentite(identiteSupprimee);

  const { error } = await supabase
    .from("identites")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur suppression identité : " + error.message);
    return;
  }

  ajouterHistorique(
    `Suppression identité : ${libelleIdentite}`,
    "identite",
    id
  );
};


  const resetNouvelleIdentiteDepuisVehicule = () => {
    setNouvelleIdentiteNom("");
    setNouvelleIdentitePrenom("");
    setNouvelleIdentiteAlias("");
    setNouvelleIdentiteNaissance("");
    setNouvelleIdentiteLieuNaissance("");
setNouvelleIdentiteDomicile("");
setNouvelleIdentiteTelephone("");
    setNouvelleIdentiteSecteur("");
    setNouvelleIdentiteFaits("");
    setNouvelleIdentiteObservations("");
  };

  const resetVehiculeForm = () => {
    setEditingVehiculeId(null);
    setVehiculeMarque("");
    setVehiculeModele("");
    setVehiculeCouleur("");
    setVehiculePlaque("");
    setVehiculeSecteur("");
    setVehiculeFaits("");
    setVehiculeFuite("");
    setVehiculeObservations("");
    setVehiculeIndividuId("");
    setVehiculePhoto("");
setVehiculePhotos([]);
setVehiculePhotoPrincipaleIndex(0);
    resetNouvelleIdentiteDepuisVehicule();
  };

  const changerIdentiteLieeVehicule = (value) => {
    setVehiculeIndividuId(value);

    if (value !== CREATE_NEW_IDENTITY) {
      resetNouvelleIdentiteDepuisVehicule();
    }
  };

  const enregistrerVehicule = async () => {
  if (!vehiculePlaque && !vehiculeMarque && !vehiculeModele) {
    alert("Renseigne au moins une plaque, une marque ou un modèle.");
    return;
  }

  let finalIndividuId = vehiculeIndividuId;

  if (vehiculeIndividuId === CREATE_NEW_IDENTITY) {
    if (!nouvelleIdentiteNom && !nouvelleIdentitePrenom && !nouvelleIdentiteAlias) {
      alert("Renseigne au moins un nom, un prénom ou un alias pour créer l'identité liée.");
      return;
    }

    const nouvelleIdentite = {
  nom: nouvelleIdentiteNom,
  prenom: nouvelleIdentitePrenom,
  alias: nouvelleIdentiteAlias,
  naissance: nouvelleIdentiteNaissance,
  lieu_naissance: nouvelleIdentiteLieuNaissance,
  domicile: nouvelleIdentiteDomicile,
  telephone: nouvelleIdentiteTelephone,
  secteur: nouvelleIdentiteSecteur,
  faits: nouvelleIdentiteFaits,
  vehicule: "",
  observations: nouvelleIdentiteObservations,
  photo: "",
};

    const { data, error } = await supabase
      .from("identites")
      .insert([nouvelleIdentite])
      .select();

    if (error) {
      console.log("ERREUR CREATION IDENTITE DEPUIS VEHICULE :", error);
      alert("Erreur création identité liée : " + error.message);
      return;
    }

    finalIndividuId = data?.[0]?.id || "";

    await chargerIdentites();
  }

  const ficheVehicule = {
    marque: vehiculeMarque,
    modele: vehiculeModele,
    couleur: vehiculeCouleur,
    immatriculation: vehiculePlaque,
    secteur: vehiculeSecteur,
    faits: vehiculeFaits,
    fuite: vehiculeFuite,
    observations: vehiculeObservations,
    photo: vehiculePhotos[vehiculePhotoPrincipaleIndex] || vehiculePhoto || "",
photos: vehiculePhotos,
photo_principale_index: vehiculePhotoPrincipaleIndex,
    identite:
      finalIndividuId && finalIndividuId !== CREATE_NEW_IDENTITY
        ? String(finalIndividuId)
        : "",
  };

  let result;

  if (editingVehiculeId) {
    result = await supabase
      .from("vehicules")
      .update(ficheVehicule)
      .eq("id", editingVehiculeId)
      .select();
  } else {
    result = await supabase
      .from("vehicules")
      .insert([ficheVehicule])
      .select();
  }

  if (result.error) {
    console.log("ERREUR ENREGISTREMENT VEHICULE :", result.error);
    alert("Erreur lors de l'enregistrement du véhicule dans Supabase.");
    return;
  }

  await chargerVehicules();

  const vehiculeEnregistre = result.data?.[0];
  const vehiculeId = editingVehiculeId || vehiculeEnregistre?.id;
  const libelleVehicule = getNomVehicule({
    marque: vehiculeMarque,
    modele: vehiculeModele,
    plaque: vehiculePlaque,
  });

  ajouterHistorique(
    editingVehiculeId
      ? `Modification véhicule : ${libelleVehicule}`
      : `Création véhicule : ${libelleVehicule}`,
    "vehicule",
    vehiculeId
  );

  resetVehiculeForm();
  setPage("vehicules");
};

  const modifierVehicule = (item) => {
    setEditingVehiculeId(item.id);
    setVehiculeMarque(item.marque || "");
    setVehiculeModele(item.modele || "");
    setVehiculeCouleur(item.couleur || "");
    setVehiculePlaque(item.plaque || "");
    setVehiculeSecteur(item.secteur || "");
    setVehiculeFaits(item.faits || "");
    setVehiculeFuite(item.fuite || "");
    setVehiculeObservations(item.observations || "");
    setVehiculePhoto(item.photo || "");
setVehiculePhotos(item.photos || []);
setVehiculePhotoPrincipaleIndex(item.photo_principale_index || 0);
    setVehiculeIndividuId(item.individuId || "");
    setPage("addVehicule");
  };

  const supprimerVehicule = async (id) => {
  const confirmation = window.confirm(
    "Confirmer la suppression de ce véhicule ?"
  );

  if (!confirmation) return;

  const vehiculeSupprime = vehicules.find((item) => String(item.id) === String(id));
  const libelleVehicule = getNomVehicule(vehiculeSupprime || {});

  const { error } = await supabase
    .from("vehicules")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur suppression véhicule : " + error.message);
    return;
  }

  ajouterHistorique(
    `Suppression véhicule : ${libelleVehicule}`,
    "vehicule",
    id
  );
};
  const handlePhoto = async (e) => {
  const files = Array.from(e.target.files || []);

  if (files.length === 0) return;

  for (const file of files) {
    const extension = file.name.split(".").pop() || "jpg";

    const fileName = `identites/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error } = await supabase.storage
      .from("photos-identites")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.log("ERREUR UPLOAD PHOTO :", error);
      alert("Erreur upload photo : " + error.message);
      continue;
    }

    const { data } = supabase.storage
      .from("photos-identites")
      .getPublicUrl(fileName);

    const nouvellePhoto = data.publicUrl;

    setPhotos((anciennesPhotos) => {
      const updatedPhotos = [...anciennesPhotos, nouvellePhoto];

      if (anciennesPhotos.length === 0) {
        setPhotoPrincipaleIndex(0);
        setPhoto(nouvellePhoto);
      }

      return updatedPhotos;
    });
  }

  e.target.value = "";
};
const handleVehiculePhoto = async (e) => {
  const files = Array.from(e.target.files || []);

  if (files.length === 0) return;

  for (const file of files) {
    const extension = file.name.split(".").pop() || "jpg";

    const fileName = `vehicules/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error } = await supabase.storage
      .from("photos-identites")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      alert("Erreur upload photo véhicule : " + error.message);
      continue;
    }

    const { data } = supabase.storage
      .from("photos-identites")
      .getPublicUrl(fileName);

    const nouvellePhoto = data.publicUrl;

    setVehiculePhotos((anciennesPhotos) => {
      const updatedPhotos = [...anciennesPhotos, nouvellePhoto];

      if (anciennesPhotos.length === 0) {
        setVehiculePhotoPrincipaleIndex(0);
        setVehiculePhoto(nouvellePhoto);
      }

      return updatedPhotos;
    });
  }

  e.target.value = "";
};
  const definirPhotoPrincipale = (index) => {
    setPhotoPrincipaleIndex(index);
    setPhoto(photos[index] || "");
  };

  const supprimerPhoto = (index) => {
  const confirmation = window.confirm("Supprimer cette photo ?");

  if (!confirmation) return;

  const updatedPhotos = photos.filter((_, photoIndex) => photoIndex !== index);

  let newPrincipalIndex = photoPrincipaleIndex;

  if (index === photoPrincipaleIndex) {
    newPrincipalIndex = 0;
  } else if (index < photoPrincipaleIndex) {
    newPrincipalIndex = photoPrincipaleIndex - 1;
  }

  setPhotos(updatedPhotos);
  setPhotoPrincipaleIndex(newPrincipalIndex);
  setPhoto(updatedPhotos[newPrincipalIndex] || "");
};

  const resetUserForm = () => {
    setEditingUser(null);
    setNewGrade("");
    setNewNom("");
    setNewPrenom("");
    setNewMatricule("");
    setNewUsername("");
    setNewPassword("");
    setNewRole("MEMBRE");
  };

  const enregistrerUtilisateur = async () => {
  if (!newUsername || !newPassword || !newRole) {
    alert("Identifiant, mot de passe et rôle obligatoires.");
    return;
  }

  const usernameClean = newUsername.trim().toLowerCase();

  if (editingUser) {
    const { error } = await supabase
      .from("users")
      .update({
        username: usernameClean,
        password: newPassword,
        role: newRole,
        grade: newGrade,
        nom: newNom,
        prenom: newPrenom,
        matricule: newMatricule,
      })
      .eq("username", editingUser);

    if (error) {
      alert("Erreur modification utilisateur : " + error.message);
      return;
    }

    await chargerUtilisateurs();
    resetUserForm();
    alert("Utilisateur modifié.");
    return;
  }

  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: usernameClean,
      password: newPassword,
      role: newRole,
      grade: newGrade,
      nom: newNom,
      prenom: newPrenom,
      matricule: newMatricule,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    alert("Erreur création utilisateur : " + result.error);
    return;
  }

  await chargerUtilisateurs();
  resetUserForm();

  alert("Utilisateur créé.");
};

  const modifierUtilisateur = (user) => {
    if (user.role === "LE TÔLIER") {
      alert("Le compte du Tôlier ne peut pas être modifié ici.");
      return;
    }

    setEditingUser(user.username);
    setNewGrade(user.grade || "");
    setNewNom(user.nom || "");
    setNewPrenom(user.prenom || "");
    setNewMatricule(user.matricule || "");
    setNewUsername(user.username || "");
    setNewPassword(user.password || "");
    setNewRole(user.role || "MEMBRE");
  };

  const supprimerUtilisateur = async (username) => {
  if (!username) {
    alert("Identifiant utilisateur manquant.");
    return;
  }

  if (username === "tolier") {
    alert("Impossible de supprimer le Tôlier.");
    return;
  }

  const confirmation = window.confirm(
    `Supprimer définitivement l'utilisateur ${username} ?`
  );

  if (!confirmation) return;

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("username", username);

  if (error) {
    console.error("ERREUR SUPPRESSION SUPABASE :", error);
    alert("Erreur suppression Supabase : " + error.message);
    return;
  }

  await chargerUtilisateurs();

  alert("Utilisateur supprimé.");
};

  const results = [...fakePeople, ...identites].filter((person) => {
    const fullText = `
      ${person.nom || ""}
      ${person.prenom || ""}
      ${person.alias || ""}
      ${person.secteur || ""}
      ${person.faits || ""}
      ${person.observations || ""}
    `.toLowerCase();

    return fullText.includes(search.toLowerCase());
  });

  const vehiculeResults = vehicules.filter((item) => {
    const fullText = `
      ${item.marque || ""}
      ${item.modele || ""}
      ${item.couleur || ""}
      ${item.plaque || ""}
      ${item.secteur || ""}
      ${item.faits || ""}
      ${item.fuite || ""}
      ${item.observations || ""}
      ${getNomIdentite(identites, item.individuId)}
    `.toLowerCase();

    return fullText.includes(search.toLowerCase());
  });

  if (!logged) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h1>ACCÈS SÉCURISÉ</h1>
          <p>RÉSERVÉ AUX MEMBRES AUTORISÉS</p>

          <input
            type="text"
            placeholder="Utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={connexion}>SE CONNECTER</button>

          <div className="app-name">L'ŒIL DE SAURON</div>
        </div>
      </div>
    );
  }

  if (page === "search") {
    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Recherche</h2>

        <input
          className="search-input"
          type="text"
          placeholder="Nom, alias, secteur, faits, véhicule, plaque..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="results-list">
          {vehiculeResults.map((item) => (
            <div className="person-card" key={item.id}>
              <div className="avatar">
  {item.photo ? (
    <img
      src={item.photo}
      alt="véhicule"
      className="person-photo"
      onClick={() => setPhotoZoom(item.photo)}
    />
  ) : (
    "🚗"
  )}
</div>

              <div className="person-info">
                <div className="person-name">
                  {getNomVehicule(item)}
                </div>

                {item.couleur && <div>Couleur : {item.couleur}</div>}
                {item.plaque && <div>Immatriculation : {item.plaque}</div>}
                {item.secteur && <div>Secteur : {item.secteur}</div>}
                {item.faits && <div>Faits : {item.faits}</div>}
                {item.fuite && <div>Direction fuite : {item.fuite}</div>}
                {item.observations && (
                  <div>Observations : {item.observations}</div>
                )}

                {item.individuId && (
                  <div className="linked-identity">
                    {getPhotoPrincipale(getIdentite(identites, item.individuId) || {}) && (
                      <img
                        src={getPhotoPrincipale(getIdentite(identites, item.individuId) || {})}
                        alt="photo identité liée"
                        className="linked-identity-photo clickable-photo"
                        onClick={() =>
                          setPhotoZoom(
                            getPhotoPrincipale(getIdentite(identites, item.individuId) || {})
                          )
                        }
                      />
                    )}
                    <span className="person-alias">
                      Identité liée : {getNomIdentite(identites, item.individuId)}
                    </span>
                  </div>
                )}

                <div className="person-actions">
                  <button
                    className="edit-btn"
                    onClick={() => basculerFavoriVehicule(item)}
                  >
                    {item.favori_bac ? "Retirer BAC" : "Épingler BAC"}
                  </button>

                  <button
                    className="edit-btn"
                    onClick={() => modifierVehicule(item)}
                  >
                    Modifier
                  </button>

                  {currentUser?.role !== "MEMBRE" && (
                    <button
                      className="delete-btn"
                      onClick={() => supprimerVehicule(item.id)}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {results.map((person) => (
            <div
              className="person-card"
              key={person.id}
              onClick={() => {
                setSelectedIdentity(person);
                setIdentityDetailsReturnPage("search");
                setPage("identityDetails");
              }}
            >
              <div className="avatar">
  {getPhotoPrincipale(person) ? (
    <img
      src={getPhotoPrincipale(person)}
      alt="photo"
      className="person-photo"
      onClick={(e) => {
        e.stopPropagation();
        setPhotoZoom(getPhotoPrincipale(person));
      }}
    />
  ) : (
    "👤"
  )}
</div>
              

              <div className="person-info">
                <div className="person-name">
                  {person.nom} {person.prenom}
                </div>

                {person.alias && (
                  <div className="person-alias">Alias : {person.alias}</div>
                )}
                {person.naissance && (
                  <div>Âge : {getAge(person.naissance)} ans</div>
                )}
                {person.secteur && (
                  <div>Secteur habituel : {person.secteur}</div>
                )}
                {person.faits && <div>Secteur faits : {person.faits}</div>}
                {vehicules
                  .filter((item) => String(item.individuId) === String(person.id))
                  .map((item) => (
                    <div key={item.id}>
                      Véhicule lié : {getNomVehicule(item)}
                    </div>
                  ))}

                {person.observations && (
                  <div>Observations : {person.observations}</div>
                )}

                <div className="person-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      modifierIdentite(person);
                    }}
                  >
                    Modifier
                  </button>

                  {currentUser?.role !== "MEMBRE" && (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerIdentite(person.id);
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <PhotoZoomOverlay
          photoZoom={photoZoom}
          onClose={() => setPhotoZoom("")}
        />
      </div>
    );
  }
if (page === "identityDetails" && selectedIdentity) {
  const person = selectedIdentity;
  const personPhotos = getPhotos(person);
  const vehiculesLies = vehicules.filter(
    (item) => String(item.individuId) === String(person.id)
  );
  const faitsHistorique = faitsIdentites.filter(
    (item) => String(item.identite_id) === String(person.id)
  );

  return (
    <div className="home-page">
      <button className="back-btn" onClick={() => setPage(identityDetailsReturnPage)}>
        ← Retour
      </button>

      <h2 className="section-title">Fiche identité</h2>

      <div className="admin-card">
        {getPhotoPrincipale(person) && (
          <img
            src={getPhotoPrincipale(person)}
            alt="photo"
            className="photo-preview"
            onClick={() => setPhotoZoom(getPhotoPrincipale(person))}
          />
        )}

        <h3>
          {person.nom} {person.prenom}
        </h3>

        {person.alias && <p>Alias : {person.alias}</p>}
        {person.naissance && <p>Date de naissance : {person.naissance}</p>}
        {person.naissance && <p>Âge : {getAge(person.naissance)} ans</p>}
        {person.lieu_naissance && <p>Lieu de naissance : {person.lieu_naissance}</p>}
        {person.domicile && <p>Domicile : {person.domicile}</p>}
        {person.telephone && <p>Téléphone : {person.telephone}</p>}
        {person.secteur && <p>Secteur habituel : {person.secteur}</p>}
        {person.faits && <p>Secteur faits : {person.faits}</p>}
        {person.observations && <p>Observations : {person.observations}</p>}
        {person.favori_bac && <p>Favori BAC : oui</p>}

        {personPhotos.length > 0 && (
          <div className="photos-grid">
            {personPhotos.map((item, index) => (
              <img
                key={index}
                src={item}
                alt={`photo ${index + 1}`}
                className="person-photo"
                onClick={() => setPhotoZoom(item)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3>Historique des faits</h3>

        {faitsHistorique.length === 0 && <p>Aucun fait enregistré.</p>}

        {faitsHistorique.map((item) => (
          <div className="user-line" key={item.id}>
            <div>
              <strong>
                {formatDateFr(item.date_fait)} : {item.description}
              </strong>
              {item.created_by && (
                <>
                  <br />
                  Ajouté par : {item.created_by}
                </>
              )}
            </div>

            {currentUser?.role !== "MEMBRE" && (
              <button
                className="delete-btn"
                onClick={() => supprimerFaitIdentite(item.id)}
              >
                Supprimer
              </button>
            )}
          </div>
        ))}

        <input
          type="date"
          value={nouveauFaitDate}
          onChange={(e) => setNouveauFaitDate(e.target.value)}
        />

        <textarea
          placeholder="Nouveau fait"
          value={nouveauFaitDescription}
          onChange={(e) => setNouveauFaitDescription(e.target.value)}
        />

        <button
          className="admin-main-btn"
          onClick={() => ajouterFaitIdentite(person.id)}
        >
          Ajouter un fait
        </button>
      </div>

      <div className="admin-card">
        <h3>Véhicules liés</h3>

        {vehiculesLies.length === 0 && <p>Aucun véhicule lié.</p>}

        {vehiculesLies.map((item) => (
          <div
            className="person-card"
            key={item.id}
            onClick={() => {
              setSelectedVehicle(item);
              setVehicleDetailsReturnPage("identityDetails");
              setPage("vehicleDetails");
            }}
          >
            <div className="avatar">
              {item.photo ? (
                <img src={item.photo} alt="véhicule" className="person-photo" />
              ) : (
                "🚗"
              )}
            </div>

            <div className="person-info">
              <div className="person-name">{getNomVehicule(item)}</div>
              {item.couleur && <div>Couleur : {item.couleur}</div>}
              {item.secteur && <div>Secteur : {item.secteur}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="person-actions">
        <button className="edit-btn" onClick={() => basculerFavoriIdentite(person)}>
          {person.favori_bac ? "Retirer BAC" : "Épingler BAC"}
        </button>

        <button className="edit-btn" onClick={() => modifierIdentite(person)}>
          Modifier
        </button>

        {currentUser?.role !== "MEMBRE" && (
          <button
            className="delete-btn"
            onClick={() => supprimerIdentite(person.id)}
          >
            Supprimer
          </button>
        )}
      </div>

      <PhotoZoomOverlay photoZoom={photoZoom} onClose={() => setPhotoZoom("")} />
    </div>
  );
}
  if (page === "secteurs") {
    const rechercheSecteurClean = rechercheSecteur.trim().toLowerCase();
    const secteursIdentites =
      typeSecteur === "habituel"
        ? identites.map((person) => person.secteur).filter(Boolean)
        : identites.map((person) => person.faits).filter(Boolean);
    const secteursVehicules =
      typeSecteur === "habituel"
        ? vehicules.map((item) => item.secteur).filter(Boolean)
        : vehicules.map((item) => item.faits).filter(Boolean);

    const secteursUniques = [...new Set([...secteursIdentites, ...secteursVehicules])]
      .filter((secteurNom) =>
        secteurNom.toLowerCase().includes(rechercheSecteurClean)
      );

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Secteurs</h2>

        <input
          className="search-input"
          type="text"
          placeholder="Rechercher un secteur..."
          value={rechercheSecteur}
          onChange={(e) => setRechercheSecteur(e.target.value)}
        />

        <div className="sector-switch">
          <button
            className={typeSecteur === "habituel" ? "active-sector" : ""}
            onClick={() => setTypeSecteur("habituel")}
          >
            Secteur habituel
          </button>

          <button
            className={typeSecteur === "faits" ? "active-sector" : ""}
            onClick={() => setTypeSecteur("faits")}
          >
            Secteur faits
          </button>
        </div>

        <div className="results-list">
          {secteursUniques.length === 0 && (
            <div className="admin-card">
              Aucun secteur trouvé.
            </div>
          )}

          {secteursUniques.map((secteurNom) => {
            const personnes = identites.filter((person) =>
              typeSecteur === "habituel"
                ? person.secteur === secteurNom
                : person.faits === secteurNom
            );
            const vehiculesSecteur = vehicules.filter((item) =>
              typeSecteur === "habituel"
                ? item.secteur === secteurNom
                : item.faits === secteurNom
            );

            return (
              <div className="person-card" key={secteurNom}>
                <div className="avatar">📍</div>

                <div className="person-info">
                  <div className="person-name">{secteurNom}</div>
                  <div>
                    {personnes.length} individu{personnes.length > 1 ? "s" : ""} /{" "}
                    {vehiculesSecteur.length} véhicule{vehiculesSecteur.length > 1 ? "s" : ""}
                  </div>

                  <div className="person-alias">Individus</div>
                  {personnes.length === 0 && <div>Aucun individu lié.</div>}

                  {personnes.map((person) => (
                    <div
                      key={person.id}
                      className="person-alias"
                      onClick={() => {
                        setSelectedIdentity(person);
                        setIdentityDetailsReturnPage("secteurs");
                        setPage("identityDetails");
                      }}
                    >
                      {person.nom} {person.prenom}
                      {person.alias ? ` — ${person.alias}` : ""}
                    </div>
                  ))}

                  <div className="person-alias">Véhicules</div>
                  {vehiculesSecteur.length === 0 && <div>Aucun véhicule lié.</div>}

                  {vehiculesSecteur.map((item) => (
                    <div
                      key={item.id}
                      className="person-alias"
                      onClick={() => {
                        setSelectedVehicle(item);
                        setVehicleDetailsReturnPage("secteurs");
                        setPage("vehicleDetails");
                      }}
                    >
                      {getNomVehicule(item)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (page === "vehicules") {
    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Véhicules</h2>

        <button
          className="admin-main-btn"
          onClick={() => {
            resetVehiculeForm();
            setPage("addVehicule");
          }}
        >
          Ajouter un véhicule
        </button>

        <div className="results-list">
          {vehicules.length === 0 && (
            <div className="admin-card">Aucun véhicule enregistré.</div>
          )}

          {vehicules.map((item) => (
            <div
              className="person-card"
              key={item.id}
              onClick={() => {
                setSelectedVehicle(item);
                setVehicleDetailsReturnPage("vehicules");
                setPage("vehicleDetails");
              }}
            >
              <div className="avatar">
  {item.photo ? (
    <img
      src={item.photo}
      alt="véhicule"
      className="person-photo"
      onClick={(e) => {
        e.stopPropagation();
        setPhotoZoom(item.photo);
      }}
    />
  ) : (
    "🚗"
  )}
</div>

              <div className="person-info">
                <div className="person-name">{getNomVehicule(item)}</div>

                {item.couleur && <div>Couleur : {item.couleur}</div>}
                {item.plaque && <div>Immatriculation : {item.plaque}</div>}
                {item.secteur && <div>Secteur : {item.secteur}</div>}
                {item.faits && <div>Faits : {item.faits}</div>}
                {item.fuite && <div>Direction fuite : {item.fuite}</div>}
                {item.observations && (
                  <div>Observations : {item.observations}</div>
                )}

                {item.individuId && (
                  <div className="linked-identity">
                    {getPhotoPrincipale(getIdentite(identites, item.individuId) || {}) && (
                      <img
                        src={getPhotoPrincipale(getIdentite(identites, item.individuId) || {})}
                        alt="photo identité liée"
                        className="linked-identity-photo clickable-photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoZoom(
                            getPhotoPrincipale(getIdentite(identites, item.individuId) || {})
                          );
                        }}
                      />
                    )}
                    <span className="person-alias">
                      Identité liée : {getNomIdentite(identites, item.individuId)}
                    </span>
                  </div>
                )}

                <div className="person-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      basculerFavoriVehicule(item);
                    }}
                  >
                    {item.favori_bac ? "Retirer BAC" : "Épingler BAC"}
                  </button>

                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      modifierVehicule(item);
                    }}
                  >
                    Modifier
                  </button>

                  {currentUser?.role !== "MEMBRE" && (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerVehicule(item.id);
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
                <PhotoZoomOverlay
          photoZoom={photoZoom}
          onClose={() => setPhotoZoom("")}
        />
      </div>
    );
	  }

  if (page === "vehicleDetails" && selectedVehicle) {
    const item = selectedVehicle;
    const identiteLiee = getIdentite(identites, item.individuId);
    const vehiculePhotosDetails = getPhotos(item);
    const vehiculePhotoPrincipale = getPhotoPrincipale(item);
    const vehiculePhotosSecondaires = vehiculePhotosDetails.filter(
      (photoItem) => photoItem !== vehiculePhotoPrincipale
    );

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage(vehicleDetailsReturnPage)}>
          ← Retour
        </button>

        <h2 className="section-title">Fiche véhicule</h2>

        <div className="admin-card">
          {vehiculePhotoPrincipale && (
            <img
              src={vehiculePhotoPrincipale}
              alt="véhicule"
              className="photo-preview"
              onClick={() => setPhotoZoom(vehiculePhotoPrincipale)}
            />
          )}

          {vehiculePhotosSecondaires.length > 0 && (
            <div className="photos-grid">
              {vehiculePhotosSecondaires.map((photoItem, index) => (
                <img
                  key={index}
                  src={photoItem}
                  alt={`photo véhicule ${index + 2}`}
                  className="person-photo"
                  onClick={() => setPhotoZoom(photoItem)}
                />
              ))}
            </div>
          )}

          <h3>{getNomVehicule(item)}</h3>

          {item.marque && <p>Marque : {item.marque}</p>}
          {item.modele && <p>Modèle : {item.modele}</p>}
          {item.couleur && <p>Couleur : {item.couleur}</p>}
          {item.plaque && <p>Immatriculation : {item.plaque}</p>}
          {item.secteur && <p>Secteur : {item.secteur}</p>}
          {item.faits && <p>Faits : {item.faits}</p>}
          {item.fuite && <p>Direction fuite : {item.fuite}</p>}
          {item.observations && <p>Observations : {item.observations}</p>}
          {item.favori_bac && <p>Favori BAC : oui</p>}
        </div>

        {identiteLiee && (
          <div className="admin-card">
            <h3>Identité liée</h3>
            <div
              className="person-card"
              onClick={() => {
                setSelectedIdentity(identiteLiee);
                setIdentityDetailsReturnPage("vehicleDetails");
                setPage("identityDetails");
              }}
            >
              <div className="avatar">
                {getPhotoPrincipale(identiteLiee) ? (
                  <img
                    src={getPhotoPrincipale(identiteLiee)}
                    alt="photo"
                    className="person-photo"
                  />
                ) : (
                  "👤"
                )}
              </div>

              <div className="person-info">
                <div className="person-name">
                  {identiteLiee.nom} {identiteLiee.prenom}
                </div>
                {identiteLiee.alias && (
                  <div className="person-alias">Alias : {identiteLiee.alias}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="person-actions">
          <button className="edit-btn" onClick={() => basculerFavoriVehicule(item)}>
            {item.favori_bac ? "Retirer BAC" : "Épingler BAC"}
          </button>

          <button className="edit-btn" onClick={() => modifierVehicule(item)}>
            Modifier
          </button>

          {currentUser?.role !== "MEMBRE" && (
            <button
              className="delete-btn"
              onClick={() => supprimerVehicule(item.id)}
            >
              Supprimer
            </button>
          )}
        </div>

        <PhotoZoomOverlay photoZoom={photoZoom} onClose={() => setPhotoZoom("")} />
      </div>
    );
  }

  if (page === "addVehicule") {
    return (
      <div className="home-page">
        <button
          className="back-btn"
          onClick={() => {
            resetVehiculeForm();
            setPage("vehicules");
          }}
        >
          ← Retour
        </button>

        <h2 className="section-title">
          {editingVehiculeId ? "Modifier véhicule" : "Ajouter véhicule"}
        </h2>

        <div className="add-form">
          <input
            type="text"
            placeholder="Marque"
            value={vehiculeMarque}
            onChange={(e) => setVehiculeMarque(e.target.value)}
          />

          <input
            type="text"
            placeholder="Modèle"
            value={vehiculeModele}
            onChange={(e) => setVehiculeModele(e.target.value)}
          />

          <input
            type="text"
            placeholder="Couleur"
            value={vehiculeCouleur}
            onChange={(e) => setVehiculeCouleur(e.target.value)}
          />

          <input
            type="text"
            placeholder="Immatriculation"
            value={vehiculePlaque}
            onChange={(e) => setVehiculePlaque(e.target.value)}
          />

          <input
            type="text"
            placeholder="Secteur concerné"
            value={vehiculeSecteur}
            onChange={(e) => setVehiculeSecteur(e.target.value)}
          />

          <input
            type="text"
            placeholder="Faits associés"
            value={vehiculeFaits}
            onChange={(e) => setVehiculeFaits(e.target.value)}
          />

          <input
            type="text"
            placeholder="Direction de fuite"
            value={vehiculeFuite}
            onChange={(e) => setVehiculeFuite(e.target.value)}
          />

          <select
            className="role-select"
            value={vehiculeIndividuId}
            onChange={(e) => changerIdentiteLieeVehicule(e.target.value)}
          >
            <option value="">Aucune identité liée</option>
            <option value={CREATE_NEW_IDENTITY}>➕ Créer une nouvelle identité</option>

            {identites.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nom} {person.prenom}
                {person.alias ? ` — ${person.alias}` : ""}
              </option>
            ))}
          </select>

          {vehiculeIndividuId === CREATE_NEW_IDENTITY && (
            <div className="admin-card">
              <h3>Nouvelle identité liée au véhicule</h3>

              <input
                type="text"
                placeholder="Nom"
                value={nouvelleIdentiteNom}
                onChange={(e) => setNouvelleIdentiteNom(e.target.value)}
              />

              <input
                type="text"
                placeholder="Prénom"
                value={nouvelleIdentitePrenom}
                onChange={(e) => setNouvelleIdentitePrenom(e.target.value)}
              />

              <input
                type="text"
                placeholder="Alias"
                value={nouvelleIdentiteAlias}
                onChange={(e) => setNouvelleIdentiteAlias(e.target.value)}
              />

              <input
                type="date"
                value={nouvelleIdentiteNaissance}
                onChange={(e) => setNouvelleIdentiteNaissance(e.target.value)}
              />
<input
  type="text"
  placeholder="Lieu de naissance"
  value={nouvelleIdentiteLieuNaissance}
  onChange={(e) => setNouvelleIdentiteLieuNaissance(e.target.value)}
/>

<input
  type="text"
  placeholder="Domicile"
  value={nouvelleIdentiteDomicile}
  onChange={(e) => setNouvelleIdentiteDomicile(e.target.value)}
/>

<input
  type="tel"
  placeholder="Téléphone"
  value={nouvelleIdentiteTelephone}
  onChange={(e) => setNouvelleIdentiteTelephone(e.target.value)}
/>
              <input
                type="text"
                placeholder="Secteur habituel"
                value={nouvelleIdentiteSecteur}
                onChange={(e) => setNouvelleIdentiteSecteur(e.target.value)}
              />

              <input
                type="text"
                placeholder="Secteur des faits"
                value={nouvelleIdentiteFaits}
                onChange={(e) => setNouvelleIdentiteFaits(e.target.value)}
              />

              <textarea
                placeholder="Observations identité"
                value={nouvelleIdentiteObservations}
                onChange={(e) => setNouvelleIdentiteObservations(e.target.value)}
              />
            </div>
          )}

          <textarea
            placeholder="Observations véhicule"
            value={vehiculeObservations}
            onChange={(e) => setVehiculeObservations(e.target.value)}
          />
{vehiculePhotos.length > 0 && (
  <div className="photos-zone">
    <div className="photos-grid">
      {vehiculePhotos.map((item, index) => (
        <div className="photo-item" key={index}>
          <img
            src={item}
            alt={`photo ${index + 1}`}
            className="person-photo"
            onClick={() => setPhotoZoom(item)}
          />

          <button
            type="button"
            className="edit-btn"
            onClick={() => setVehiculePhotoPrincipaleIndex(index)}
          >
            Principale
          </button>
<button
  type="button"
  className="delete-btn"
  onClick={() => {
    const confirmation = window.confirm("Supprimer cette photo véhicule ?");
    if (!confirmation) return;

    const updatedPhotos = vehiculePhotos.filter(
      (_, photoIndex) => photoIndex !== index
    );

    let newIndex = vehiculePhotoPrincipaleIndex;

    if (index === vehiculePhotoPrincipaleIndex) {
      newIndex = 0;
    } else if (index < vehiculePhotoPrincipaleIndex) {
      newIndex = vehiculePhotoPrincipaleIndex - 1;
    }

    setVehiculePhotos(updatedPhotos);
    setVehiculePhotoPrincipaleIndex(newIndex);
    setVehiculePhoto(updatedPhotos[newIndex] || "");
  }}
>
  Supprimer
</button>
          {index === vehiculePhotoPrincipaleIndex && (
            <div className="person-alias">Photo principale</div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

<div className="photo-buttons">
  <label className="photo-btn">
    📷 Prendre une photo
    <input
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      onChange={handleVehiculePhoto}
    />
  </label>

  <label className="photo-btn">
    🖼️ Galerie photo
    <input
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={handleVehiculePhoto}
    />
  </label>
</div>
          <button className="save-btn" onClick={enregistrerVehicule}>
            {editingVehiculeId ? "Modifier" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  if (page === "individus") {
    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Individus enregistrés</h2>

        <div className="results-list">
          {identites.length === 0 && (
            <div className="admin-card">
              Aucune identité enregistrée.
            </div>
          )}

          {identites.map((person) => (
            <div
              className="person-card"
              key={person.id}
              onClick={() => {
                setSelectedIdentity(person);
                setIdentityDetailsReturnPage("individus");
                setPage("identityDetails");
              }}
            >
              <div className="avatar">
  {getPhotoPrincipale(person) ? (
    <img
      src={getPhotoPrincipale(person)}
      alt="photo"
      className="person-photo"
      onClick={(e) => {
        e.stopPropagation();
        setPhotoZoom(getPhotoPrincipale(person));
      }}
    />
  ) : (
    "👤"
  )}
</div>
              

              <div className="person-info">
                <div className="person-name">
                  {person.nom} {person.prenom}
                </div>

                {person.alias && (
                  <div className="person-alias">Alias : {person.alias}</div>
                )}
                {person.naissance && (
                  <div>Âge : {getAge(person.naissance)} ans</div>
                )}
                {person.secteur && (
                  <div>Secteur habituel : {person.secteur}</div>
                )}
                {person.faits && <div>Secteur faits : {person.faits}</div>}
                {vehicules
                  .filter((item) => String(item.individuId) === String(person.id))
                  .map((item) => (
                    <div key={item.id}>
                      Véhicule lié : {getNomVehicule(item)}
                    </div>
                  ))}

                {person.observations && (
                  <div>Observations : {person.observations}</div>
                )}

                <div className="person-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      basculerFavoriIdentite(person);
                    }}
                  >
                    {person.favori_bac ? "Retirer BAC" : "Épingler BAC"}
                  </button>

                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      modifierIdentite(person);
                    }}
                  >
                    Modifier
                  </button>

                  {currentUser?.role !== "MEMBRE" && (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerIdentite(person.id);
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <PhotoZoomOverlay
          photoZoom={photoZoom}
          onClose={() => setPhotoZoom("")}
        />
      </div>
    );
  }

  if (page === "add") {
    return (
      <div className="home-page">
        <button
          className="back-btn"
          onClick={() => {
            resetIdentityForm();
            setPage("home");
          }}
        >
          ← Retour
        </button>

        <h2 className="section-title">
          {editingId ? "Modifier une identité" : "Ajouter une identité"}
        </h2>

        <div className="add-form">
          <input
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />

          <input
            type="text"
            placeholder="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
          />

          <input
            type="text"
            placeholder="Alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />

          <input
            type="date"
            value={naissance}
            onChange={(e) => setNaissance(e.target.value)}
          />
<input
  type="text"
  placeholder="Lieu de naissance"
  value={lieuNaissance}
  onChange={(e) => setLieuNaissance(e.target.value)}
/>

<input
  type="text"
  placeholder="Domicile"
  value={domicile}
  onChange={(e) => setDomicile(e.target.value)}
/>

<input
  type="tel"
  placeholder="Téléphone"
  value={telephone}
  onChange={(e) => setTelephone(e.target.value)}
/>
          <input
            type="text"
            placeholder="Secteur habituel"
            value={secteur}
            onChange={(e) => setSecteur(e.target.value)}
          />

          <input
            type="text"
            placeholder="Secteur des faits"
            value={faits}
            onChange={(e) => setFaits(e.target.value)}
          />

          {editingId && (
            <div className="admin-card">
              <h3>Véhicules liés</h3>

              {vehicules.filter((item) => String(item.individuId) === String(editingId)).length === 0 && (
                <p>Aucun véhicule lié.</p>
              )}

              {vehicules
                .filter((item) => String(item.individuId) === String(editingId))
                .map((item) => (
                  <p key={item.id}>{getNomVehicule(item)}</p>
                ))}
            </div>
          )}

          <textarea
            placeholder="Observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />

          {photos.length > 0 && (
  <div className="photos-zone">
    <div className="photos-grid">
      {photos.map((item, index) => (
        <div className="photo-item" key={index}>
          <img
            src={item}
            alt={`photo ${index + 1}`}
            className="person-photo"
            onClick={(e) => {
              e.stopPropagation();
              setPhotoZoom(item);
            }}
          />

          <button
            type="button"
            className="edit-btn"
            onClick={() => definirPhotoPrincipale(index)}
          >
            Principale
          </button>

          <button
            type="button"
            className="delete-btn"
            onClick={() => supprimerPhoto(index)}
          >
            Supprimer
          </button>

          {index === photoPrincipaleIndex && (
            <div className="person-alias">Photo principale</div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

          <div className="photo-buttons">
            <label className="photo-btn">
              📷 Prendre une photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handlePhoto}
              />
            </label>

            <label className="photo-btn">
              🖼️ Galerie photo
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handlePhoto}
              />
            </label>
          </div>

          <button className="save-btn" onClick={enregistrerIdentite}>
            {editingId ? "Modifier" : "Enregistrer"}
          </button>
        </div>
        <PhotoZoomOverlay
          photoZoom={photoZoom}
          onClose={() => setPhotoZoom("")}
        />
      </div>
    );
  }

  if (
  page === "admin" &&
  currentUser &&
  (
    currentUser.role === "LE TÔLIER" ||
    currentUser.role === "ADMINISTRATEUR"
  )
) {
    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Administration</h2>

        {currentUser && currentUser.role === "LE TÔLIER" && (
          <div className="admin-buttons">
            <button
              className="admin-main-btn"
              onClick={() => setPage("users")}
            >
              Gestion utilisateurs
            </button>

            <button
              className="admin-main-btn"
              onClick={() => setPage("historique")}
            >
              Historique
            </button>
          </div>
        )}

        <div className="admin-card">
          <h3>Utilisateur connecté</h3>
          <p>Identifiant : {currentUser?.username}</p>
          <p>Grade : {currentUser?.grade}</p>
          <p>Nom : {currentUser?.nom}</p>
          <p>Prénom : {currentUser?.prenom}</p>
          <p>Matricule : {currentUser?.matricule}</p>
          <p>Fonction : {currentUser?.role}</p>
        </div>

        <div className="admin-card">
          <h3>Gestion des droits</h3>
          <p>Le Tôlier : accès total</p>
          <p>Administrateur : gestion opérationnelle</p>
          <p>Membre : consultation, ajout et modification</p>
        </div>
      </div>
    );
  }

  if (page === "historique") {
    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("admin")}>
          ← Retour
        </button>

        <h2 className="section-title">Historique</h2>

        {currentUser && currentUser.role === "LE TÔLIER" && (
          <button className="delete-btn" onClick={viderHistorique}>
            Vider l'historique
          </button>
        )}

        <div className="results-list">
          {historique.length === 0 && (
            <div className="admin-card">Aucun historique.</div>
          )}

          {historique.map((item) => (
            <div className="person-card" key={item.id}>
              <div className="avatar">🕘</div>

              <div className="person-info">
                <div className="person-name">{item.action}</div>
                <div>Utilisateur : {item.username || item.utilisateur || "Inconnu"}</div>
                <div>Date : {formatDateFr(item.created_at) || item.date}</div>
                <div>Heure : {formatHeureFr(item.created_at) || item.heure}</div>
                {item.type_objet && <div>Type : {item.type_objet}</div>}
                {item.objet_id && <div>ID : {item.objet_id}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "users") {
    return (
      <div className="home-page">
        <button
          className="back-btn"
          onClick={() => {
            resetUserForm();
            setPage("admin");
          }}
        >
          ← Retour
        </button>

        <h2 className="section-title">Gestion utilisateurs</h2>

        <div className="admin-card">
          <h3>
            {editingUser ? "Modifier utilisateur" : "Créer utilisateur"}
          </h3>

          <input
            type="text"
            placeholder="Grade"
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
          />

          <input
            type="text"
            placeholder="Nom"
            value={newNom}
            onChange={(e) => setNewNom(e.target.value)}
          />

          <input
            type="text"
            placeholder="Prénom"
            value={newPrenom}
            onChange={(e) => setNewPrenom(e.target.value)}
          />

          <input
            type="text"
            placeholder="Matricule"
            value={newMatricule}
            onChange={(e) => setNewMatricule(e.target.value)}
          />

          <input
            type="text"
            placeholder="Identifiant"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />

          <input
            type="text"
            placeholder="Mot de passe visible"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <select
            className="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="MEMBRE">MEMBRE</option>
            <option value="ADMINISTRATEUR">ADMINISTRATEUR</option>
          </select>

          <button className="admin-main-btn" onClick={enregistrerUtilisateur}>
            {editingUser ? "ENREGISTRER MODIFICATION" : "CRÉER UTILISATEUR"}
          </button>

          {editingUser && (
            <button className="cancel-btn" onClick={resetUserForm}>
              ANNULER MODIFICATION
            </button>
          )}
        </div>

        <div className="admin-card">
          <h3>Comptes actuels</h3>

          {users.map((user) => (
            <div className="user-line" key={user.username}>
              <div>
                <strong>
                  {user.grade} {user.nom} {user.prenom}
                </strong>
                <br />
                Matricule : {user.matricule}
                <br />
                Identifiant : {user.username}
                <br />
                Mot de passe : {user.password}
                <br />
                Fonction : {user.role}
              </div>

              {user.role !== "LE TÔLIER" && (
                <div className="user-buttons">
                  <button
                    className="edit-btn"
                    onClick={() => modifierUtilisateur(user)}
                  >
                    Modifier
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => supprimerUtilisateur(user.username)}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "favorisBac") {
    const identitesFavorites = identites.filter((person) => person.favori_bac);
    const vehiculesFavoris = vehicules.filter((item) => item.favori_bac);

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Favoris BAC</h2>

        <div className="admin-card">
          <h3>Individus prioritaires</h3>
          {identitesFavorites.length === 0 && <p>Aucun individu épinglé.</p>}

          {identitesFavorites.map((person) => (
            <div
              className="person-card"
              key={person.id}
              onClick={() => {
                setSelectedIdentity(person);
                setIdentityDetailsReturnPage("favorisBac");
                setPage("identityDetails");
              }}
            >
              <div className="avatar">
                {getPhotoPrincipale(person) ? (
                  <img
                    src={getPhotoPrincipale(person)}
                    alt="photo"
                    className="person-photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoZoom(getPhotoPrincipale(person));
                    }}
                  />
                ) : (
                  "👤"
                )}
              </div>

              <div className="person-info">
                <div className="person-name">{getLibelleIdentite(person)}</div>
                {person.alias && <div className="person-alias">Alias : {person.alias}</div>}
                {person.secteur && <div>Secteur habituel : {person.secteur}</div>}
                {person.faits && <div>Secteur faits : {person.faits}</div>}

                <div className="person-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      basculerFavoriIdentite(person);
                    }}
                  >
                    Retirer BAC
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-card">
          <h3>Véhicules recherchés</h3>
          {vehiculesFavoris.length === 0 && <p>Aucun véhicule épinglé.</p>}

          {vehiculesFavoris.map((item) => (
            <div
              className="person-card"
              key={item.id}
              onClick={() => {
                setSelectedVehicle(item);
                setVehicleDetailsReturnPage("favorisBac");
                setPage("vehicleDetails");
              }}
            >
              <div className="avatar">
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt="véhicule"
                    className="person-photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoZoom(item.photo);
                    }}
                  />
                ) : (
                  "🚗"
                )}
              </div>

              <div className="person-info">
                <div className="person-name">{getNomVehicule(item)}</div>
                {item.couleur && <div>Couleur : {item.couleur}</div>}
                {item.secteur && <div>Secteur : {item.secteur}</div>}
                {item.faits && <div>Faits : {item.faits}</div>}

                <div className="person-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      basculerFavoriVehicule(item);
                    }}
                  >
                    Retirer BAC
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <PhotoZoomOverlay
          photoZoom={photoZoom}
          onClose={() => setPhotoZoom("")}
        />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="top-bar">
        <div className="home-title">L'ŒIL DE SAURON</div>

        <div className="group-name">GROUPE 8 - {currentUser?.grade} {currentUser?.nom?.toUpperCase()} {currentUser?.prenom} - {currentUser?.matricule} - {currentUser?.role?.toUpperCase()}</div>

        <button className="logout-btn" onClick={deconnexion}>
          Déconnexion
        </button>
      </div>

      <div className="menu-grid">
        <div className="menu-card" onClick={() => setPage("search")}>
          🔍
          <span>Recherche</span>
        </div>

        <div className="menu-card" onClick={() => setPage("add")}>
          ➕
          <span>Ajouter une identité</span>
        </div>

        <div className="menu-card" onClick={() => setPage("individus")}>
          👥
          <span>Individus</span>
        </div>

        <div className="menu-card" onClick={() => setPage("vehicules")}>
          🚗
          <span>Véhicules</span>
        </div>

        <div className="menu-card" onClick={() => setPage("secteurs")}>
          📍
          <span>Secteurs</span>
        </div>

        <div className="menu-card" onClick={() => setPage("favorisBac")}>
          ⭐
          <span>Favoris BAC</span>
        </div>

        {currentUser &&
  currentUser.role !== "MEMBRE" &&
  (currentUser.role === "LE TÔLIER" ||
    currentUser.role === "ADMINISTRATEUR") && (
  <div className="menu-card" onClick={() => setPage("admin")}>
    ⚙️
    <span>Administration</span>
  </div>
)}
        
      </div>
      <PhotoZoomOverlay
        photoZoom={photoZoom}
        onClose={() => setPhotoZoom("")}
      />
    </div>
  );
}

export default App;
