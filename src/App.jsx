import "./App.css";
import { useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { supabase } from "./supabase";

const initialUsers = [];

const CREATE_NEW_IDENTITY = "__CREATE_NEW_IDENTITY__";
const COLLEGUES_CAISSE_CAFE = [
  "Cedric",
  "Benjamin",
  "Tayeb",
  "Michel",
  "Thomas",
  "Sebastien",
  "Hugo",
  "Quentin",
];
const PRODUITS_CAISSE_CAFE_DEFAUT = [
  { value: "boisson_sans_alcool", label: "Boisson sans alcool", prix: 1 },
  { value: "eau", label: "Eau", prix: 0.5 },
  { value: "biere", label: "Bière", prix: 2 },
  { value: "condiments_050", label: "Condiments 0,50 €", prix: 0.5 },
  { value: "condiments_100", label: "Condiments 1 €", prix: 1 },
  { value: "cafe", label: "Café", prix: 2 },
];
const TYPES_CONGES_P4 = [
  "CF",
  "RPS",
  "CA en cours",
  "CA HP",
  "CA antérieur",
  "RTC",
  "RTT",
  "CET",
  "ASA",
  "STAGE",
  "OPTION",
];
const VIE_GROUPE_MODULES = {
  ficheIndividuelle: {
    label: "Fiche individuelle",
    tableType: "fiche_individuelle",
    icon: "🩺",
  },
  materiel: {
    label: "Matériel",
    tableType: "materiel",
    icon: "🎒",
  },
  habilitations: {
    label: "Habilitations",
    tableType: "habilitations",
    icon: "🎓",
  },
  tir: {
    label: "Tir",
    tableType: "tir",
    icon: "🎯",
  },
};
const VIE_GROUPE_DOSSIER_FIELDS = {
  ficheIndividuelle: [
    ["maladies", "Maladie(s)"],
    ["traitements", "Traitement(s)"],
    ["allergies", "Allergie(s)"],
    ["groupe_sanguin", "Groupe sanguin"],
    ["coordonnees", "Coordonnées perso"],
    ["personne_confiance_nom", "Personne de confiance - nom"],
    ["personne_confiance_prenom", "Personne de confiance - prénom"],
    ["personne_confiance_telephone", "Personne de confiance - téléphone"],
    ["autre", "Autre"],
  ],
  materiel: [
    ["materiel", "Matériel"],
    ["references", "Références / numéros"],
    ["etat", "État"],
    ["observations", "Observations"],
  ],
  habilitations: [
    ["habilitations", "Habilitations"],
    ["stages", "Stages"],
    ["dates", "Dates / validité"],
    ["observations", "Observations"],
  ],
  tir: [
    ["date_tir", "Date du tir"],
    ["arme", "Arme"],
    ["resultat", "Résultat"],
    ["observations", "Observations"],
  ],
};
const VIE_GROUPE_OPTION_MODULES = ["materiel", "habilitations", "tir"];
const VIE_GROUPE_OPTION_LABELS = {
  materiel: "Matériel / armement",
  habilitations: "Habilitation / stage",
  tir: "Type de tir / arme",
};
const P4_CYCLE_START = "2026-01-12";
const createP4Period = () => ({
  tempId: `${Date.now()}-${Math.random()}`,
  type: "CA en cours",
  date_debut: "",
  date_fin: "",
  commentaire: "",
});
const MOIS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const FACE_API_MODEL_URL = "/models/face-api";
let faceApiModelsPromise = null;

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

function trierIdentitesParNom(values) {
  return [...values].sort((a, b) => {
    const nomA = `${a.nom || ""} ${a.prenom || ""} ${a.alias || ""}`;
    const nomB = `${b.nom || ""} ${b.prenom || ""} ${b.alias || ""}`;

    return nomA.localeCompare(nomB, "fr", { sensitivity: "base" });
  });
}

function getIdentite(identites, individuId) {
  return identites.find((item) => String(item.id) === String(individuId));
}

function normaliserTexteIdentite(value) {
  return (value || "").trim().toLowerCase();
}

function normaliserP4(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getCollegueDepuisUser(user) {
  return (user?.prenom || user?.username || "").trim();
}

function getListeCollegues(users) {
  const collegues = [...COLLEGUES_CAISSE_CAFE];

  (users || []).forEach((user) => {
    const collegue = getP4CollegueLabel(getCollegueDepuisUser(user));

    if (
      collegue &&
      !collegues.some((item) => normaliserP4(item) === normaliserP4(collegue))
    ) {
      collegues.push(collegue);
    }
  });

  return collegues.sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );
}

function getP4CollegueUtilisateur(user, collegues = COLLEGUES_CAISSE_CAFE) {
  const prenom = normaliserP4(user?.prenom || user?.username || "");

  return (
    collegues.find((collegue) => normaliserP4(collegue) === prenom) ||
    ""
  );
}

function getP4CollegueLabel(value) {
  return normaliserP4(value) === "benjoin" ? "Benjamin" : value;
}

function getP4TypeCourt(type) {
  return type === "CA en cours" ? "CA" : type;
}

function getP4Nature(item) {
  if (item?.nature) return item.nature;
  if (["demande", "previsionnel"].includes(item?.statut)) return item.statut;
  return "demande";
}

function getP4NatureLabel(item) {
  return getP4Nature(item) === "previsionnel" ? "Prévisionnel" : "Demande";
}

function isP4NatureColumnMissing(error) {
  return (error?.message || "").includes("'nature' column");
}

function removeP4Nature(payload) {
  const { nature, ...rest } = payload;
  return rest;
}

function isVieGroupeTitreColumnMissing(error) {
  return (error?.message || "").includes("'titre' column");
}

function removeVieGroupeTitre(payload) {
  const { titre, ...rest } = payload;
  return rest;
}

function getVieGroupeTitre(item) {
  return item?.titre || (item?.type === "photo" ? item?.contenu : "") || "";
}

function ajouterDelaiDate(dateDepart, nombre, unite) {
  const date = new Date(dateDepart);
  const quantite = Number(nombre || 0);

  if (!quantite) return "";

  if (unite === "jours") {
    date.setDate(date.getDate() + quantite);
  } else if (unite === "mois") {
    date.setMonth(date.getMonth() + quantite);
  } else {
    date.setFullYear(date.getFullYear() + quantite);
  }

  return toDateInputValue(date);
}

function calculerEcheanceVieGroupe(option, dateReference = new Date()) {
  if (!option || option.validite_type === "aucune") return "";
  if (option.validite_type === "date") return option.validite_date || "";
  if (option.validite_type === "delai") {
    return ajouterDelaiDate(
      dateReference,
      option.validite_delai_nombre,
      option.validite_delai_unite
    );
  }

  return "";
}

function getClasseEcheanceVieGroupe(dateValue) {
  if (!dateValue) return "";

  const aujourdHui = new Date();
  const echeance = new Date(dateValue);
  const diffJours = Math.ceil((echeance - aujourdHui) / (1000 * 60 * 60 * 24));

  if (diffJours <= 14) return "echeance-rouge";
  if (diffJours <= 31) return "echeance-orange";

  return "";
}

function normaliserPlaque(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
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

function lireFichierEnDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function chargerImagePourAnalyse(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    if (!src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function chargerModelesVisage() {
  if (!faceApiModelsPromise) {
    faceApiModelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_API_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_MODEL_URL),
    ]);
  }

  return faceApiModelsPromise;
}

async function extraireDescripteurVisage(src) {
  await chargerModelesVisage();

  const image = await chargerImagePourAnalyse(src);
  const detection = await faceapi
    .detectSingleFace(
      image,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.35,
      })
    )
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  return detection || null;
}

function calculerScoreVisage(distance) {
  return Math.max(0, Math.min(100, Math.round((1 - distance / 0.75) * 100)));
}

function getNiveauCorrespondance(distance) {
  if (distance <= 0.5) return "Très proche";
  if (distance <= 0.6) return "Proche";
  if (distance <= 0.75) return "À vérifier";
  return "Faible";
}

function formatDateFr(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR");
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateLocale(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function startOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);

  return start;
}

function getMonthDays(year, monthIndex) {
  const days = [];
  const date = new Date(year, monthIndex, 1);

  while (date.getMonth() === monthIndex) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
}

function getWeekDays(date) {
  const start = startOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function isSameDay(a, b) {
  return toDateInputValue(a) === toDateInputValue(b);
}

function isDateInRange(date, start, end) {
  const value = toDateInputValue(date);

  return value >= start && value <= end;
}

function getP4CycleInfo(date) {
  const cycleStart = parseDateLocale(P4_CYCLE_START);
  const diffDays = Math.floor((startOfWeek(date) - cycleStart) / 86400000);
  const weekIndex = Math.floor(diffDays / 7);
  const cycleWeek = ((weekIndex % 2) + 2) % 2;
  const day = date.getDay() || 7;
  const workingDays = cycleWeek === 0 ? [3, 4] : [1, 2, 5, 6, 7];
  const isWorking = workingDays.includes(day);

  return {
    cycleWeek: cycleWeek + 1,
    isWorking,
  };
}

function formatHeureFr(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("fr-FR");
}

function formatMontantEuro(value) {
  const montant = Number(value || 0);

  return montant.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
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
  if (!logged) return;

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
}, [logged]);
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
  const [historiqueSearch, setHistoriqueSearch] = useState("");
  const [historiqueSelectedUser, setHistoriqueSelectedUser] = useState("");
  const [notificationsMasquees, setNotificationsMasquees] = useState(() =>
    safeParseArray(localStorage.getItem("notificationsMasquees"))
  );
  const colleguesApplication = getListeCollegues(users);

  const [editingVehiculeId, setEditingVehiculeId] = useState(null);
  const [vehiculeMarque, setVehiculeMarque] = useState("");
  const [vehiculeModele, setVehiculeModele] = useState("");
  const [vehiculeCouleur, setVehiculeCouleur] = useState("");
  const [vehiculePlaque, setVehiculePlaque] = useState("");
  const [duplicateVehiculeWarningKey, setDuplicateVehiculeWarningKey] = useState("");
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
  const [recherchePhoto, setRecherchePhoto] = useState("");
  const [recherchePhotoResults, setRecherchePhotoResults] = useState([]);
  const [recherchePhotoLoading, setRecherchePhotoLoading] = useState(false);
  const [recherchePhotoError, setRecherchePhotoError] = useState("");
  const [rechercheSecteur, setRechercheSecteur] = useState("");
  const [typeSecteur, setTypeSecteur] = useState("habituel");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [duplicateIdentityWarningKey, setDuplicateIdentityWarningKey] = useState("");
  const [retourIdentiteInterpellation, setRetourIdentiteInterpellation] = useState(false);
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
  const [faitsIdentiteEnCreation, setFaitsIdentiteEnCreation] = useState([]);
  const [caisseCafe, setCaisseCafe] = useState([]);
  const [caisseCafeSoldes, setCaisseCafeSoldes] = useState([]);
  const [produitsCaisseCafe, setProduitsCaisseCafe] = useState(PRODUITS_CAISSE_CAFE_DEFAUT);
  const [caisseCafeCollegue, setCaisseCafeCollegue] = useState("");
  const [caisseCafeProduit, setCaisseCafeProduit] = useState("");
  const [caisseCafeQuantite, setCaisseCafeQuantite] = useState("");
  const [caisseCafePrix, setCaisseCafePrix] = useState("");
  const [editingCaisseCafeId, setEditingCaisseCafeId] = useState(null);
  const [soldeCafeCollegue, setSoldeCafeCollegue] = useState("");
  const [soldeCafeMontant, setSoldeCafeMontant] = useState("");
  const [nouveauProduitCafeNom, setNouveauProduitCafeNom] = useState("");
  const [nouveauProduitCafePrix, setNouveauProduitCafePrix] = useState("");
  const [interpellations, setInterpellations] = useState([]);
  const [selectedInterpellationYear, setSelectedInterpellationYear] = useState(null);
  const [selectedInterpellationMonth, setSelectedInterpellationMonth] = useState(null);
  const [anneesInterpellationsAjoutees, setAnneesInterpellationsAjoutees] = useState([]);
  const [editingInterpellationId, setEditingInterpellationId] = useState(null);
  const [interpellationDate, setInterpellationDate] = useState("");
  const [interpellationType, setInterpellationType] = useState("initiative");
  const [interpellationAuteurNom, setInterpellationAuteurNom] = useState("");
  const [interpellationAuteurPrenom, setInterpellationAuteurPrenom] = useState("");
  const [interpellationAuteurs, setInterpellationAuteurs] = useState([]);
  const [interpellationInfractions, setInterpellationInfractions] = useState("");
  const [interpellationNombre, setInterpellationNombre] = useState("");
  const [p4Conges, setP4Conges] = useState([]);
  const [p4Vue, setP4Vue] = useState("mois");
  const [p4Date, setP4Date] = useState(toDateInputValue(new Date()));
  const [p4Collegue, setP4Collegue] = useState("");
  const [p4FormMode, setP4FormMode] = useState("demande");
  const [p4EditionStatut, setP4EditionStatut] = useState("demande");
  const [p4Periodes, setP4Periodes] = useState([createP4Period()]);
  const [editingP4Id, setEditingP4Id] = useState(null);
  const [editingP4Item, setEditingP4Item] = useState(null);
  const [vieGroupeItems, setVieGroupeItems] = useState([]);
  const [vieGroupeOnglet, setVieGroupeOnglet] = useState("photos");
  const [vieGroupePhotoTitre, setVieGroupePhotoTitre] = useState("");
  const [editingVieGroupePhotoId, setEditingVieGroupePhotoId] = useState(null);
  const [vieGroupeTexte, setVieGroupeTexte] = useState("");
  const [editingVieGroupeId, setEditingVieGroupeId] = useState(null);
  const [vieGroupeDossiers, setVieGroupeDossiers] = useState([]);
  const [vieGroupeOptions, setVieGroupeOptions] = useState([]);
  const [caisseCafeRappels, setCaisseCafeRappels] = useState([]);
  const [rappelCafeVu, setRappelCafeVu] = useState(false);
  const [selectedVieGroupeModule, setSelectedVieGroupeModule] = useState(null);
  const [selectedVieGroupeCollegue, setSelectedVieGroupeCollegue] = useState("");
  const [editingVieGroupeDossierId, setEditingVieGroupeDossierId] = useState(null);
  const [vieGroupeDossierForm, setVieGroupeDossierForm] = useState({});
  const [editingVieGroupeOptionId, setEditingVieGroupeOptionId] = useState(null);
  const [vieGroupeOptionNom, setVieGroupeOptionNom] = useState("");
  const [vieGroupeOptionValiditeType, setVieGroupeOptionValiditeType] = useState("aucune");
  const [vieGroupeOptionValiditeDate, setVieGroupeOptionValiditeDate] = useState("");
  const [vieGroupeOptionValiditeDelaiNombre, setVieGroupeOptionValiditeDelaiNombre] = useState("");
  const [vieGroupeOptionValiditeDelaiUnite, setVieGroupeOptionValiditeDelaiUnite] = useState("ans");
    useEffect(() => {
  if (!logged) return;

  chargerIdentites();
  chargerVehicules();
  chargerFaitsIdentites();
  chargerJournalModifications();
  chargerCaisseCafe();
  chargerCaisseCafeSoldes();
  chargerProduitsCaisseCafe();
  chargerInterpellations();
  chargerP4Conges();
  chargerVieGroupe();
  chargerVieGroupeDossiers();
  chargerVieGroupeOptions();
  chargerCaisseCafeRappels();

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

  const caisseCafeChannel = supabase
    .channel("realtime-caisse-cafe")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "caisse_cafe",
      },
      () => {
        chargerCaisseCafe();
      }
    )
    .subscribe();

  const caisseCafeSoldesChannel = supabase
    .channel("realtime-caisse-cafe-soldes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "caisse_cafe_soldes",
      },
      () => {
        chargerCaisseCafeSoldes();
      }
    )
    .subscribe();

  const caisseCafeProduitsChannel = supabase
    .channel("realtime-caisse-cafe-produits")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "caisse_cafe_produits",
      },
      () => {
        chargerProduitsCaisseCafe();
      }
    )
    .subscribe();

  const interpellationsChannel = supabase
    .channel("realtime-interpellations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "interpellations",
      },
      () => {
        chargerInterpellations();
      }
    )
    .subscribe();

  const p4CongesChannel = supabase
    .channel("realtime-p4-conges")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "p4_conges",
      },
      () => {
        chargerP4Conges();
      }
    )
    .subscribe();

  const vieGroupeChannel = supabase
    .channel("realtime-vie-groupe")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vie_groupe",
      },
      () => {
        chargerVieGroupe();
      }
    )
    .subscribe();

  const vieGroupeDossiersChannel = supabase
    .channel("realtime-vie-groupe-dossiers")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vie_groupe_dossiers",
      },
      () => {
        chargerVieGroupeDossiers();
      }
    )
    .subscribe();

  const vieGroupeOptionsChannel = supabase
    .channel("realtime-vie-groupe-options")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vie_groupe_options",
      },
      () => {
        chargerVieGroupeOptions();
      }
    )
    .subscribe();

  const caisseCafeRappelsChannel = supabase
    .channel("realtime-caisse-cafe-rappels")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "caisse_cafe_rappels",
      },
      () => {
        chargerCaisseCafeRappels();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(identitesChannel);
    supabase.removeChannel(vehiculesChannel);
    supabase.removeChannel(faitsIdentitesChannel);
    supabase.removeChannel(journalModificationsChannel);
    supabase.removeChannel(caisseCafeChannel);
    supabase.removeChannel(caisseCafeSoldesChannel);
    supabase.removeChannel(caisseCafeProduitsChannel);
    supabase.removeChannel(interpellationsChannel);
    supabase.removeChannel(p4CongesChannel);
    supabase.removeChannel(vieGroupeChannel);
    supabase.removeChannel(vieGroupeDossiersChannel);
    supabase.removeChannel(vieGroupeOptionsChannel);
    supabase.removeChannel(caisseCafeRappelsChannel);
  };
}, [logged]);

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

const ajouterFaitIdentiteEnCreation = () => {
  if (!nouveauFaitDate || !nouveauFaitDescription.trim()) {
    alert("Renseigne une date et un fait.");
    return;
  }

  setFaitsIdentiteEnCreation((items) => [
    ...items,
    {
      id: Date.now(),
      date_fait: nouveauFaitDate,
      description: nouveauFaitDescription.trim(),
      created_by: currentUser?.username || "",
    },
  ]);
  setNouveauFaitDate("");
  setNouveauFaitDescription("");
};

const supprimerFaitIdentiteEnCreation = (id) => {
  setFaitsIdentiteEnCreation((items) =>
    items.filter((item) => item.id !== id)
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

const chargerCaisseCafe = async () => {
  const { data, error } = await supabase
    .from("caisse_cafe")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR CAISSE CAFÉ :", error);
    return;
  }

  setCaisseCafe(data || []);
};

const chargerCaisseCafeSoldes = async () => {
  const { data, error } = await supabase
    .from("caisse_cafe_soldes")
    .select("*")
    .order("collegue", { ascending: true });

  if (error) {
    console.log("ERREUR SOLDES CAISSE CAFÉ :", error);
    return;
  }

  setCaisseCafeSoldes(data || []);
};

const chargerProduitsCaisseCafe = async () => {
  const { data, error } = await supabase
    .from("caisse_cafe_produits")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    console.log("ERREUR PRODUITS CAISSE CAFÉ :", error);
    setProduitsCaisseCafe(PRODUITS_CAISSE_CAFE_DEFAUT);
    return;
  }

  const produitsPersonnalises = (data || []).map((item) => ({
    value: item.value,
    label: item.label,
    prix: Number(item.prix || 0),
  }));

  setProduitsCaisseCafe([
    ...PRODUITS_CAISSE_CAFE_DEFAUT,
    ...produitsPersonnalises,
  ]);
};

const chargerInterpellations = async () => {
  const { data, error } = await supabase
    .from("interpellations")
    .select("*")
    .order("date_interpellation", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR INTERPELLATIONS :", error);
    return;
  }

  setInterpellations(data || []);
};

const chargerP4Conges = async () => {
  const { data, error } = await supabase
    .from("p4_conges")
    .select("*")
    .order("date_debut", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR P4 :", error);
    return;
  }

  setP4Conges(data || []);
};

const chargerVieGroupe = async () => {
  const { data, error } = await supabase
    .from("vie_groupe")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR VIE DE GROUPE :", error);
    return;
  }

  setVieGroupeItems(data || []);
};

const chargerVieGroupeDossiers = async () => {
  const { data, error } = await supabase
    .from("vie_groupe_dossiers")
    .select("*")
    .order("collegue", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR DOSSIERS VIE DE GROUPE :", error);
    return;
  }

  setVieGroupeDossiers(data || []);
};

const chargerVieGroupeOptions = async () => {
  const { data, error } = await supabase
    .from("vie_groupe_options")
    .select("*")
    .order("module_key", { ascending: true })
    .order("nom", { ascending: true });

  if (error) {
    console.log("ERREUR OPTIONS VIE DE GROUPE :", error);
    setVieGroupeOptions([]);
    return;
  }

  setVieGroupeOptions(data || []);
};

const chargerCaisseCafeRappels = async () => {
  const { data, error } = await supabase
    .from("caisse_cafe_rappels")
    .select("*")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ERREUR RAPPELS CAISSE CAFÉ :", error);
    setCaisseCafeRappels([]);
    return;
  }

  setCaisseCafeRappels(data || []);
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

  const peutGererVieGroupe =
    currentUser?.role === "LE TÔLIER" ||
    currentUser?.role === "ADMINISTRATEUR";

  const peutModifierVieGroupeItem = (item) =>
    peutGererVieGroupe || item.created_by === currentUser?.username;

  const resetVieGroupeForm = () => {
    setVieGroupeTexte("");
    setEditingVieGroupeId(null);
  };

  const resetVieGroupePhotoForm = () => {
    setVieGroupePhotoTitre("");
    setEditingVieGroupePhotoId(null);
  };

  const enregistrerAnecdoteVieGroupe = async () => {
    const texte = vieGroupeTexte.trim();

    if (!texte) {
      alert("Écris une anecdote avant d'enregistrer.");
      return;
    }

    const payload = {
      type: "texte",
      contenu: texte,
      redacteur: `${currentUser?.prenom || ""} ${currentUser?.nom || ""}`.trim() ||
        currentUser?.username ||
        "Inconnu",
      created_by: currentUser?.username || "Inconnu",
      updated_by: currentUser?.username || "Inconnu",
    };
    const result = editingVieGroupeId
      ? await supabase.from("vie_groupe").update(payload).eq("id", editingVieGroupeId)
      : await supabase.from("vie_groupe").insert([payload]);

    if (result.error) {
      alert("Erreur vie de groupe : " + result.error.message);
      return;
    }

    await chargerVieGroupe();
    ajouterHistorique(
      `${editingVieGroupeId ? "Modification" : "Ajout"} anecdote vie de groupe`,
      "vie_groupe",
      editingVieGroupeId
    );
    resetVieGroupeForm();
  };

  const modifierVieGroupeItem = (item) => {
    if (!peutModifierVieGroupeItem(item)) {
      alert("Tu peux modifier uniquement tes souvenirs ou anecdotes.");
      return;
    }

    setEditingVieGroupeId(item.id);
    setVieGroupeTexte(item.contenu || "");
  };

  const supprimerVieGroupeItem = async (item) => {
    if (!peutGererVieGroupe) {
      alert("Seuls le Tôlier et les administrateurs peuvent supprimer.");
      return;
    }

    const confirmation = window.confirm("Supprimer cet élément de la vie de groupe ?");
    if (!confirmation) return;

    const { error } = await supabase
      .from("vie_groupe")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert("Erreur suppression vie de groupe : " + error.message);
      return;
    }

    await chargerVieGroupe();
    ajouterHistorique(
      `Suppression vie de groupe : ${item.type}`,
      "vie_groupe",
      item.id
    );
  };

  const modifierVieGroupePhoto = (item) => {
    if (!peutModifierVieGroupeItem(item)) {
      alert("Tu peux modifier uniquement tes souvenirs ou anecdotes.");
      return;
    }

    setEditingVieGroupePhotoId(item.id);
    setVieGroupePhotoTitre(getVieGroupeTitre(item));
  };

  const enregistrerTitreVieGroupePhoto = async () => {
    if (!editingVieGroupePhotoId) return;

    const payload = {
      titre: vieGroupePhotoTitre.trim(),
      updated_by: currentUser?.username || "Inconnu",
    };
    let result = await supabase
      .from("vie_groupe")
      .update(payload)
      .eq("id", editingVieGroupePhotoId);

    if (isVieGroupeTitreColumnMissing(result.error)) {
      result = await supabase
        .from("vie_groupe")
        .update({
          contenu: payload.titre,
          updated_by: payload.updated_by,
        })
        .eq("id", editingVieGroupePhotoId);
    }

    if (result.error) {
      alert("Erreur titre photo : " + result.error.message);
      return;
    }

    await chargerVieGroupe();
    ajouterHistorique("Modification titre photo vie de groupe", "vie_groupe", editingVieGroupePhotoId);
    resetVieGroupePhotoForm();
  };

  const handleVieGroupePhoto = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    for (const file of files) {
      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `vie-groupe/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("photos-identites")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        alert("Erreur photo vie de groupe : " + error.message);
        continue;
      }

      const { data } = supabase.storage
        .from("photos-identites")
        .getPublicUrl(fileName);

      const payload = {
        type: "photo",
        titre: vieGroupePhotoTitre.trim(),
        photo_url: data.publicUrl,
        redacteur: `${currentUser?.prenom || ""} ${currentUser?.nom || ""}`.trim() ||
          currentUser?.username ||
          "Inconnu",
        created_by: currentUser?.username || "Inconnu",
        updated_by: currentUser?.username || "Inconnu",
      };
      let result = await supabase.from("vie_groupe").insert([payload]);

      if (isVieGroupeTitreColumnMissing(result.error)) {
        result = await supabase
          .from("vie_groupe")
          .insert([
            {
              ...removeVieGroupeTitre(payload),
              contenu: payload.titre,
            },
          ]);
      }

      if (result.error) {
        alert("Erreur enregistrement photo vie de groupe : " + result.error.message);
        continue;
      }

      ajouterHistorique("Ajout photo vie de groupe", "vie_groupe");
    }

    await chargerVieGroupe();
    resetVieGroupePhotoForm();
    e.target.value = "";
  };

  const peutGererVieGroupeDossiers =
    currentUser?.role === "LE TÔLIER" ||
    currentUser?.role === "ADMINISTRATEUR";

  const peutModifierVieGroupeDossier = (item) =>
    peutGererVieGroupeDossiers || item.created_by === currentUser?.username;

  const ouvrirVieGroupeDossier = (moduleKey, collegue) => {
    setSelectedVieGroupeModule(moduleKey);
    setSelectedVieGroupeCollegue(collegue);
    setEditingVieGroupeDossierId(null);
    setVieGroupeDossierForm({});
    setPage("vieGroupeDossier");
  };

  const modifierVieGroupeDossier = (item) => {
    if (!peutModifierVieGroupeDossier(item)) {
      alert("Tu peux modifier uniquement ta fiche.");
      return;
    }

    setEditingVieGroupeDossierId(item.id);
    setVieGroupeDossierForm(item.data || {});
  };

  const resetVieGroupeDossierForm = () => {
    setEditingVieGroupeDossierId(null);
    setVieGroupeDossierForm({});
  };

  const changerVieGroupeDossierForm = (field, value) => {
    setVieGroupeDossierForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const getOptionsVieGroupeModule = (moduleKey) =>
    vieGroupeOptions.filter((item) => item.module_key === moduleKey);

  const resetVieGroupeOptionForm = () => {
    setEditingVieGroupeOptionId(null);
    setVieGroupeOptionNom("");
    setVieGroupeOptionValiditeType("aucune");
    setVieGroupeOptionValiditeDate("");
    setVieGroupeOptionValiditeDelaiNombre("");
    setVieGroupeOptionValiditeDelaiUnite("ans");
  };

  const modifierVieGroupeOption = (option) => {
    setEditingVieGroupeOptionId(option.id);
    setVieGroupeOptionNom(option.nom || "");
    setVieGroupeOptionValiditeType(option.validite_type || "aucune");
    setVieGroupeOptionValiditeDate(option.validite_date || "");
    setVieGroupeOptionValiditeDelaiNombre(
      option.validite_delai_nombre ? String(option.validite_delai_nombre) : ""
    );
    setVieGroupeOptionValiditeDelaiUnite(option.validite_delai_unite || "ans");
  };

  const enregistrerVieGroupeOption = async () => {
    if (!peutGererVieGroupeDossiers) {
      alert("Seuls le Tôlier et les administrateurs peuvent gérer les choix.");
      return;
    }

    const nomOption = vieGroupeOptionNom.trim();

    if (!selectedVieGroupeModule || !nomOption) {
      alert("Renseigne le nom de l'élément.");
      return;
    }

    const payload = {
      module_key: selectedVieGroupeModule,
      nom: nomOption,
      validite_type: vieGroupeOptionValiditeType,
      validite_date:
        vieGroupeOptionValiditeType === "date" ? vieGroupeOptionValiditeDate : null,
      validite_delai_nombre:
        vieGroupeOptionValiditeType === "delai"
          ? Number(vieGroupeOptionValiditeDelaiNombre || 0)
          : null,
      validite_delai_unite:
        vieGroupeOptionValiditeType === "delai"
          ? vieGroupeOptionValiditeDelaiUnite
          : null,
      updated_by: currentUser?.username || "Inconnu",
    };

    const result = editingVieGroupeOptionId
      ? await supabase
          .from("vie_groupe_options")
          .update(payload)
          .eq("id", editingVieGroupeOptionId)
      : await supabase.from("vie_groupe_options").insert([
          {
            ...payload,
            created_by: currentUser?.username || "Inconnu",
          },
        ]);

    if (result.error) {
      alert("Erreur choix vie de groupe : " + result.error.message);
      return;
    }

    await chargerVieGroupeOptions();
    ajouterHistorique(
      `${editingVieGroupeOptionId ? "Modification" : "Ajout"} choix ${VIE_GROUPE_OPTION_LABELS[selectedVieGroupeModule] || "vie de groupe"} : ${nomOption}`,
      "vie_groupe_options",
      editingVieGroupeOptionId
    );
    resetVieGroupeOptionForm();
  };

  const supprimerVieGroupeOption = async (option) => {
    if (!peutGererVieGroupeDossiers) {
      alert("Seuls le Tôlier et les administrateurs peuvent supprimer un choix.");
      return;
    }

    const confirmation = window.confirm(`Supprimer le choix "${option.nom}" ?`);
    if (!confirmation) return;

    const { error } = await supabase
      .from("vie_groupe_options")
      .delete()
      .eq("id", option.id);

    if (error) {
      alert("Erreur suppression choix : " + error.message);
      return;
    }

    await chargerVieGroupeOptions();
    ajouterHistorique(
      `Suppression choix vie de groupe : ${option.nom}`,
      "vie_groupe_options",
      option.id
    );
  };

  const enregistrerVieGroupeDossier = async () => {
    const module = VIE_GROUPE_MODULES[selectedVieGroupeModule];
    const collegueFinal = selectedVieGroupeCollegue;

    if (!module || !collegueFinal) return;

    if (!peutGererVieGroupeDossiers && collegueFinal !== collegueP4Utilisateur) {
      alert("Tu peux modifier uniquement ta fiche.");
      return;
    }

    const optionSelectionnee = vieGroupeOptions.find(
      (option) => String(option.id) === String(vieGroupeDossierForm.element_id)
    );
    const dateReference =
      vieGroupeDossierForm.date_obtention || toDateInputValue(new Date());
    const dataFinale = {
      ...vieGroupeDossierForm,
      element_nom: optionSelectionnee?.nom || vieGroupeDossierForm.element_nom || "",
      echeance: optionSelectionnee
        ? calculerEcheanceVieGroupe(optionSelectionnee, dateReference)
        : vieGroupeDossierForm.echeance || "",
    };

    const payload = {
      type: module.tableType,
      collegue: collegueFinal,
      data: dataFinale,
      created_by: currentUser?.username || "Inconnu",
      updated_by: currentUser?.username || "Inconnu",
    };
    const result = editingVieGroupeDossierId
      ? await supabase
          .from("vie_groupe_dossiers")
          .update({
            data: dataFinale,
            updated_by: currentUser?.username || "Inconnu",
          })
          .eq("id", editingVieGroupeDossierId)
      : await supabase.from("vie_groupe_dossiers").insert([payload]);

    if (result.error) {
      alert("Erreur vie de groupe : " + result.error.message);
      return;
    }

    await chargerVieGroupeDossiers();
    ajouterHistorique(
      `${editingVieGroupeDossierId ? "Modification" : "Ajout"} ${module.label} : ${collegueFinal}`,
      "vie_groupe_dossiers",
      editingVieGroupeDossierId
    );
    resetVieGroupeDossierForm();
  };

  const supprimerVieGroupeDossier = async (item) => {
    if (!peutGererVieGroupeDossiers) {
      alert("Seuls le Tôlier et les administrateurs peuvent supprimer.");
      return;
    }

    const confirmation = window.confirm("Supprimer cette fiche ?");
    if (!confirmation) return;

    const { error } = await supabase
      .from("vie_groupe_dossiers")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert("Erreur suppression fiche : " + error.message);
      return;
    }

    await chargerVieGroupeDossiers();
    ajouterHistorique(
      `Suppression fiche vie de groupe : ${item.type} ${item.collegue}`,
      "vie_groupe_dossiers",
      item.id
    );
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

  const getDateInterpellationSelectionnee = () => {
    const year = selectedInterpellationYear || new Date().getFullYear();
    const month = selectedInterpellationMonth ?? new Date().getMonth();
    const day = String(new Date().getDate()).padStart(2, "0");

    return `${year}-${String(month + 1).padStart(2, "0")}-${day}`;
  };

  const resetInterpellationForm = () => {
    setEditingInterpellationId(null);
    setInterpellationDate(getDateInterpellationSelectionnee());
    setInterpellationType("initiative");
    setInterpellationAuteurNom("");
    setInterpellationAuteurPrenom("");
    setInterpellationAuteurs([]);
    setInterpellationInfractions("");
    setInterpellationNombre("");
  };

  const ajouterAuteurInterpellation = () => {
    const auteur = `${interpellationAuteurNom.trim()} ${interpellationAuteurPrenom.trim()}`
      .trim();

    if (!auteur) {
      alert("Renseigne le nom ou le prénom de l'auteur.");
      return;
    }

    setInterpellationAuteurs((auteurs) => [...auteurs, auteur]);
    setInterpellationAuteurNom("");
    setInterpellationAuteurPrenom("");
  };

  const ouvrirIdentiteAuteurInterpellation = () => {
    const nomRecherche = interpellationAuteurNom.trim().toLowerCase();
    const prenomRecherche = interpellationAuteurPrenom.trim().toLowerCase();

    if (!nomRecherche && !prenomRecherche) {
      alert("Renseigne le nom ou le prénom de l'auteur.");
      return;
    }

    const identiteExistante = identites.find((person) => {
      const memeNom = nomRecherche
        ? (person.nom || "").trim().toLowerCase() === nomRecherche
        : true;
      const memePrenom = prenomRecherche
        ? (person.prenom || "").trim().toLowerCase() === prenomRecherche
        : true;

      return memeNom && memePrenom;
    });

    setRetourIdentiteInterpellation(true);

    if (identiteExistante) {
      modifierIdentite(identiteExistante);
      return;
    }

    resetIdentityForm();
    setNom(interpellationAuteurNom.trim());
    setPrenom(interpellationAuteurPrenom.trim());
    setPage("add");
  };

  const ignorerIdentiteAuteurInterpellation = () => {
    const auteur = getLibelleIdentite({ nom, prenom, alias });

    if (!auteur || auteur === "Identité sans nom") {
      alert("Renseigne au moins le nom ou le prénom de l'auteur.");
      return;
    }

    setInterpellationAuteurs((auteurs) => [
      ...new Set([...auteurs, auteur]),
    ]);
    setRetourIdentiteInterpellation(false);
    resetIdentityForm();
    setPage("interpellations");
  };

  const supprimerAuteurInterpellation = (index) => {
    setInterpellationAuteurs((auteurs) =>
      auteurs.filter((_, auteurIndex) => auteurIndex !== index)
    );
  };

  const enregistrerInterpellation = async () => {
    const nombreInterpelles = Number(interpellationNombre);
    const auteurSaisi =
      `${interpellationAuteurNom.trim()} ${interpellationAuteurPrenom.trim()}`
        .trim();
    const auteurs = [...interpellationAuteurs, auteurSaisi].filter(Boolean);

    if (!interpellationDate) {
      alert("Renseigne la date.");
      return;
    }

    if (auteurs.length === 0) {
      alert("Ajoute au moins un auteur.");
      return;
    }

    if (!interpellationInfractions.trim()) {
      alert("Renseigne l'infraction.");
      return;
    }

    if (!nombreInterpelles || nombreInterpelles <= 0) {
      alert("Renseigne un nombre d'interpellés valide.");
      return;
    }

    const fiche = {
      date_interpellation: interpellationDate,
      type: interpellationType,
      auteur_nom: auteurs.join(", "),
      auteur_prenom: "",
      infractions: interpellationInfractions.trim(),
      nombre_interpelles: nombreInterpelles,
      created_by: currentUser?.username || "Inconnu",
    };

    const result = editingInterpellationId
      ? await supabase
          .from("interpellations")
          .update(fiche)
          .eq("id", editingInterpellationId)
      : await supabase.from("interpellations").insert([fiche]);

    if (result.error) {
      alert("Erreur interpellation : " + result.error.message);
      return;
    }

    await chargerInterpellations();
    ajouterHistorique(
      `${editingInterpellationId ? "Modification" : "Création"} interpellation : ${fiche.infractions} (${nombreInterpelles})`,
      "interpellation",
      editingInterpellationId
    );
    resetInterpellationForm();
  };

  const modifierInterpellation = (item) => {
    setEditingInterpellationId(item.id);
    setInterpellationDate(item.date_interpellation || "");
    setInterpellationType(item.type || "initiative");
    setInterpellationAuteurNom("");
    setInterpellationAuteurPrenom("");
    setInterpellationAuteurs(
      `${item.auteur_nom || ""} ${item.auteur_prenom || ""}`
        .split(",")
        .map((auteur) => auteur.trim())
        .filter(Boolean)
    );
    setInterpellationInfractions(item.infractions || "");
    setInterpellationNombre(String(item.nombre_interpelles || ""));
  };

  const supprimerInterpellation = async (id) => {
    const confirmation = window.confirm("Supprimer cette fiche interpellation ?");

    if (!confirmation) return;

    const item = interpellations.find((entry) => String(entry.id) === String(id));

    const { error } = await supabase
      .from("interpellations")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erreur suppression interpellation : " + error.message);
      return;
    }

    await chargerInterpellations();
    ajouterHistorique(
      `Suppression interpellation : ${item?.infractions || id}`,
      "interpellation",
      id
    );
  };

  const ajouterAnneeInterpellation = () => {
    const anneesExistantes = [
      new Date().getFullYear(),
      ...anneesInterpellationsAjoutees,
      ...interpellations.map((item) =>
        new Date(item.date_interpellation).getFullYear()
      ),
    ];
    const nouvelleAnnee = Math.max(...anneesExistantes) + 1;

    setAnneesInterpellationsAjoutees((annees) => [
      ...new Set([...annees, nouvelleAnnee]),
    ]);
    ajouterHistorique(
      `Ajout année interpellations : ${nouvelleAnnee}`,
      "interpellation_annee",
      nouvelleAnnee
    );
  };

  const supprimerAnneeInterpellation = async (annee) => {
    if (
      currentUser?.role !== "LE TÔLIER" &&
      currentUser?.role !== "ADMINISTRATEUR"
    ) {
      alert("Seul le Tôlier ou un administrateur peut supprimer une année.");
      return;
    }

    const fichesAnnee = interpellations.filter(
      (item) => new Date(item.date_interpellation).getFullYear() === annee
    );
    const confirmation = window.confirm(
      fichesAnnee.length > 0
        ? `Supprimer l'année ${annee} et ses ${fichesAnnee.length} fiche(s) ?`
        : `Supprimer l'année ${annee} ?`
    );

    if (!confirmation) return;

    if (fichesAnnee.length > 0) {
      const { error } = await supabase
        .from("interpellations")
        .delete()
        .gte("date_interpellation", `${annee}-01-01`)
        .lte("date_interpellation", `${annee}-12-31`);

      if (error) {
        alert("Erreur suppression année : " + error.message);
        return;
      }

      await chargerInterpellations();
    }

    setAnneesInterpellationsAjoutees((annees) =>
      annees.filter((item) => item !== annee)
    );
    ajouterHistorique(
      `Suppression année interpellations : ${annee}`,
      "interpellation_annee",
      annee
    );
  };

  const peutGererP4 =
    currentUser?.role === "LE TÔLIER" ||
    currentUser?.role === "ADMINISTRATEUR";
  const collegueP4Utilisateur = getP4CollegueUtilisateur(currentUser, colleguesApplication);
  const peutModifierP4Item = (item) =>
    peutGererP4 ||
    (item.created_by === currentUser?.username &&
      ["demande", "previsionnel", "refuse"].includes(item.statut));
  const rappelCafeActif = caisseCafeRappels.find(
    (item) => item.collegue === collegueP4Utilisateur
  );

  if (logged && rappelCafeActif && !rappelCafeVu) {
    return (
      <div className="cafe-reminder-overlay">
        <div className="cafe-reminder-box">
          <h1>Rappel caisse café</h1>
          <p>{rappelCafeActif.message || "oublie pas de payer vielle pince"}</p>
          <button className="admin-main-btn" onClick={() => setRappelCafeVu(true)}>
            oui patron
          </button>
        </div>
      </div>
    );
  }

  const resetP4Form = () => {
    setEditingP4Id(null);
    setEditingP4Item(null);
    setP4Collegue("");
    setP4FormMode("demande");
    setP4EditionStatut("demande");
    setP4Periodes([createP4Period()]);
  };

  const changerModeP4 = (mode) => {
    if (editingP4Id) return;
    setP4FormMode(mode);
  };

  const ajouterP4Periode = () => {
    setP4Periodes((periodes) => [...periodes, createP4Period()]);
  };

  const modifierP4Periode = (tempId, field, value) => {
    setP4Periodes((periodes) =>
      periodes.map((periode) =>
        periode.tempId === tempId ? { ...periode, [field]: value } : periode
      )
    );
  };

  const retirerP4Periode = (tempId) => {
    setP4Periodes((periodes) =>
      periodes.length === 1
        ? periodes
        : periodes.filter((periode) => periode.tempId !== tempId)
    );
  };

  const enregistrerP4Conge = async () => {
    const periodesValides = p4Periodes.filter(
      (periode) => periode.date_debut || periode.date_fin || periode.commentaire
    );

    const collegueFinal = peutGererP4 ? p4Collegue : collegueP4Utilisateur;

    if (!collegueFinal || periodesValides.length === 0) {
      alert("Renseigne le collègue et au moins une période.");
      return;
    }

    const periodeIncomplete = periodesValides.find(
      (periode) => !periode.date_debut || !periode.date_fin || !periode.type
    );

    if (periodeIncomplete) {
      alert("Chaque période doit avoir un type, une date de début et une date de fin.");
      return;
    }

    const periodeInversee = periodesValides.find(
      (periode) => periode.date_fin < periode.date_debut
    );

    if (periodeInversee) {
      alert("La date de fin doit être après la date de début pour chaque période.");
      return;
    }

    const relanceRefus =
      editingP4Id && editingP4Item?.statut === "refuse" && !peutGererP4;
    const statut =
      editingP4Id && peutGererP4
        ? p4EditionStatut
        : relanceRefus
          ? p4FormMode === "previsionnel"
            ? "previsionnel"
            : "demande"
          : p4FormMode;
    const payloads = periodesValides.map((periode) => ({
      collegue: collegueFinal,
      date_debut: periode.date_debut,
      date_fin: periode.date_fin,
      type: periode.type,
      statut,
      nature: statut === "previsionnel" ? "previsionnel" : p4FormMode,
      commentaire: relanceRefus
        ? [
            `Ancienne demande : ${formatDateFr(editingP4Item?.date_debut)} au ${formatDateFr(editingP4Item?.date_fin)}`,
            `Nouvelle demande : ${formatDateFr(periode.date_debut)} au ${formatDateFr(periode.date_fin)}`,
            periode.commentaire,
          ]
            .filter(Boolean)
            .join("\n")
        : periode.commentaire,
      created_by: currentUser?.username || "Inconnu",
      updated_by: currentUser?.username || "Inconnu",
    }));

    let result = editingP4Id
      ? await supabase.from("p4_conges").update(payloads[0]).eq("id", editingP4Id)
      : await supabase.from("p4_conges").insert(payloads);

    if (isP4NatureColumnMissing(result.error)) {
      const fallbackPayloads = payloads.map(removeP4Nature);

      result = editingP4Id
        ? await supabase.from("p4_conges").update(fallbackPayloads[0]).eq("id", editingP4Id)
        : await supabase.from("p4_conges").insert(fallbackPayloads);
    }

    if (result.error) {
      alert("Erreur P4 : " + result.error.message);
      return;
    }

    await chargerP4Conges();
    ajouterHistorique(
      `${editingP4Id ? "Modification" : "Ajout"} P4 ${statut} : ${collegueFinal} — ${payloads.length} période(s)`,
      "p4_conges",
      editingP4Id
    );
    resetP4Form();
  };

  const modifierP4Conge = (item) => {
    if (!peutModifierP4Item(item)) {
      alert("Tu peux modifier uniquement tes demandes en attente.");
      return;
    }

    setEditingP4Id(item.id);
    setEditingP4Item(item);
    setP4Collegue(item.collegue || "");
    setP4FormMode(item.statut === "previsionnel" ? "previsionnel" : "demande");
    setP4EditionStatut(item.statut || "demande");
    setP4Periodes([
      {
        tempId: `${item.id}-edition`,
        type: item.type || "CA en cours",
        date_debut: item.date_debut || "",
        date_fin: item.date_fin || item.date_debut || "",
        commentaire: item.commentaire || "",
      },
    ]);
  };

  const changerStatutP4Conge = async (item, statut) => {
    if (!peutGererP4) {
      alert("Seuls le Tôlier et les administrateurs peuvent modifier le P4.");
      return;
    }

    const payload = {
      statut,
      nature: item.nature || getP4Nature(item),
      updated_by: currentUser?.username || "Inconnu",
    };
    let { error } = await supabase
      .from("p4_conges")
      .update(payload)
      .eq("id", item.id);

    if (isP4NatureColumnMissing(error)) {
      const retry = await supabase
        .from("p4_conges")
        .update(removeP4Nature(payload))
        .eq("id", item.id);

      error = retry.error;
    }

    if (error) {
      alert("Erreur statut P4 : " + error.message);
      return;
    }

    await chargerP4Conges();
    ajouterHistorique(
      `Statut P4 ${statut} : ${item.collegue} — ${item.type}`,
      "p4_conges",
      item.id
    );
  };

  const supprimerP4Conge = async (item, demanderConfirmation = true) => {
    if (!peutGererP4) {
      alert("Seuls le Tôlier et les administrateurs peuvent supprimer du P4.");
      return;
    }

    const confirmation =
      !demanderConfirmation || window.confirm("Supprimer cette ligne P4 ?");

    if (!confirmation) return;

    const { error } = await supabase
      .from("p4_conges")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert("Erreur suppression P4 : " + error.message);
      return;
    }

    await chargerP4Conges();
    ajouterHistorique(
      `Suppression P4 : ${item.collegue} — ${item.type}`,
      "p4_conges",
      item.id
    );
  };

  const masquerNotification = (notificationKey) => {
    setNotificationsMasquees((current) => {
      const updated = [...new Set([...current, notificationKey])];
      localStorage.setItem("notificationsMasquees", JSON.stringify(updated));
      return updated;
    });
  };

  const supprimerNotification = async (notification) => {
    const supprimerDansRubrique = window.confirm(
      "OK : supprimer aussi dans la rubrique concernée.\nAnnuler : supprimer uniquement cette notification."
    );

    if (supprimerDansRubrique && notification.type === "p4") {
      await supprimerP4Conge(notification.item, false);
      return;
    }

    masquerNotification(notification.key);
  };

  const changerProduitCaisseCafe = (produit) => {
    const produitConfig = produitsCaisseCafe.find((item) => item.value === produit);

    setCaisseCafeProduit(produit);
    setCaisseCafePrix(produitConfig ? String(produitConfig.prix) : "");
  };

  const enregistrerConsommationCaisseCafe = async () => {
    const quantite = Number(caisseCafeQuantite);
    const prixUnitaire = Number(caisseCafePrix.replace(",", "."));
    const produitConfig = produitsCaisseCafe.find(
      (item) => item.value === caisseCafeProduit
    );

    if (!caisseCafeCollegue) {
      alert("Choisis un collègue.");
      return;
    }

    if (!caisseCafeProduit || !produitConfig) {
      alert("Choisis un produit.");
      return;
    }

    if (!quantite || quantite <= 0) {
      alert("Renseigne une quantité valide.");
      return;
    }

    if (!prixUnitaire || prixUnitaire <= 0) {
      alert("Renseigne un prix valide.");
      return;
    }

    const total = quantite * prixUnitaire;
    const libelleProduit = produitConfig?.label || caisseCafeProduit;

    if (!editingCaisseCafeId) {
      const confirmation = window.confirm(
        `Confirmer l'ajout ?\n\nCollègue : ${caisseCafeCollegue}\nProduit : ${libelleProduit}\nQuantité : ${quantite}\nTotal : ${formatMontantEuro(total)}`
      );

      if (!confirmation) return;
    }

    const ficheConsommation = {
      collegue: caisseCafeCollegue,
      produit: caisseCafeProduit,
      produit_label: libelleProduit,
      quantite,
      prix_unitaire: prixUnitaire,
      total,
      created_by: currentUser?.username || "Inconnu",
    };

    const result = editingCaisseCafeId
      ? await supabase
          .from("caisse_cafe")
          .update(ficheConsommation)
          .eq("id", editingCaisseCafeId)
      : await supabase.from("caisse_cafe").insert([ficheConsommation]);

    if (result.error) {
      alert("Erreur caisse café : " + result.error.message);
      return;
    }

    setCaisseCafeCollegue("");
    setCaisseCafeProduit("");
    setCaisseCafeQuantite("");
    setCaisseCafePrix("");
    setEditingCaisseCafeId(null);
    await chargerCaisseCafe();
    ajouterHistorique(
      `${editingCaisseCafeId ? "Modification" : "Ajout"} caisse café : ${caisseCafeCollegue} — ${libelleProduit} x${quantite} (${formatMontantEuro(total)})`,
      "caisse_cafe"
    );
  };

  const modifierConsommationCaisseCafe = (item) => {
    if (
      currentUser?.role !== "LE TÔLIER" &&
      currentUser?.role !== "ADMINISTRATEUR"
    ) {
      alert("Seul le Tôlier ou un administrateur peut modifier une consommation.");
      return;
    }

    setEditingCaisseCafeId(item.id);
    setCaisseCafeCollegue(item.collegue || colleguesApplication[0] || "");
    setCaisseCafeProduit(item.produit || "boisson_sans_alcool");
    setCaisseCafeQuantite(String(item.quantite || 1));
    setCaisseCafePrix(String(item.prix_unitaire || 1));
  };

  const annulerModificationCaisseCafe = () => {
    setEditingCaisseCafeId(null);
    setCaisseCafeCollegue("");
    setCaisseCafeProduit("");
    setCaisseCafeQuantite("");
    setCaisseCafePrix("");
  };

  const ajouterProduitCaisseCafe = async () => {
    if (
      currentUser?.role !== "LE TÔLIER" &&
      currentUser?.role !== "ADMINISTRATEUR"
    ) {
      alert("Seul le Tôlier ou un administrateur peut ajouter un produit.");
      return;
    }

    const label = nouveauProduitCafeNom.trim();
    const prix = Number(nouveauProduitCafePrix.replace(",", "."));

    if (!label) {
      alert("Renseigne le nom du produit.");
      return;
    }

    if (!prix || prix <= 0) {
      alert("Renseigne un prix valide.");
      return;
    }

    const value = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const { error } = await supabase.from("caisse_cafe_produits").insert([
      {
        value,
        label,
        prix,
        created_by: currentUser?.username || "Inconnu",
      },
    ]);

    if (error) {
      alert("Erreur ajout produit : " + error.message);
      return;
    }

    setNouveauProduitCafeNom("");
    setNouveauProduitCafePrix("");
    await chargerProduitsCaisseCafe();
    ajouterHistorique(
      `Ajout produit caisse café : ${label} — ${formatMontantEuro(prix)}`,
      "caisse_cafe_produit"
    );
  };

  const modifierSoldeCaisseCafe = async () => {
    const montant = Number(soldeCafeMontant.replace(",", "."));

    if (!soldeCafeCollegue) {
      alert("Choisis un collègue.");
      return;
    }

    if (Number.isNaN(montant) || montant < 0) {
      alert("Renseigne un solde valide.");
      return;
    }

    const soldeExistant = caisseCafeSoldes.find(
      (item) => item.collegue === soldeCafeCollegue
    );

    const payload = {
      collegue: soldeCafeCollegue,
      solde: montant,
      updated_by: currentUser?.username || "Inconnu",
    };

    const result = soldeExistant
      ? await supabase
          .from("caisse_cafe_soldes")
          .update(payload)
          .eq("id", soldeExistant.id)
      : await supabase.from("caisse_cafe_soldes").insert([payload]);

    if (result.error) {
      alert("Erreur modification solde : " + result.error.message);
      return;
    }

    setSoldeCafeMontant("");
    await chargerCaisseCafeSoldes();
    ajouterHistorique(
      `Modification solde caisse café : ${soldeCafeCollegue} — ${formatMontantEuro(montant)}`,
      "caisse_cafe_solde"
    );
  };

  const supprimerConsommationCaisseCafe = async (id) => {
    if (currentUser?.role === "MEMBRE") {
      alert("Seul un administrateur peut supprimer une consommation.");
      return;
    }

    const confirmation = window.confirm("Supprimer cette consommation ?");

    if (!confirmation) return;

    const mouvement = caisseCafe.find((item) => String(item.id) === String(id));

    const { error } = await supabase
      .from("caisse_cafe")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erreur suppression caisse café : " + error.message);
      return;
    }

    await chargerCaisseCafe();
    ajouterHistorique(
      `Suppression consommation caisse café : ${mouvement ? `${mouvement.collegue} — ${mouvement.produit_label || mouvement.produit} (${formatMontantEuro(mouvement.total)})` : id}`,
      "caisse_cafe",
      id
    );
  };

  const activerRappelCaisseCafe = async (collegue) => {
    if (currentUser?.role === "MEMBRE") {
      alert("Seul le Tôlier ou un administrateur peut envoyer un rappel.");
      return;
    }

    const confirmation = window.confirm(`Envoyer un rappel de paiement à ${collegue} ?`);
    if (!confirmation) return;

    const payload = {
      collegue,
      actif: true,
      message: "oublie pas de payer vielle pince",
      created_by: currentUser?.username || "Inconnu",
      updated_by: currentUser?.username || "Inconnu",
    };

    const result = await supabase
      .from("caisse_cafe_rappels")
      .upsert([payload], { onConflict: "collegue" });

    if (result.error) {
      alert("Erreur rappel caisse café : " + result.error.message);
      return;
    }

    await chargerCaisseCafeRappels();
    ajouterHistorique(`Rappel paiement caisse café : ${collegue}`, "caisse_cafe_rappel");
  };

  const desactiverRappelCaisseCafe = async (collegue) => {
    const { error } = await supabase
      .from("caisse_cafe_rappels")
      .update({
        actif: false,
        updated_by: currentUser?.username || "Inconnu",
      })
      .eq("collegue", collegue);

    if (error) {
      console.log("ERREUR DÉSACTIVATION RAPPEL CAFÉ :", error);
      return;
    }

    await chargerCaisseCafeRappels();
  };

  const enregistrerSoldesRestantsCaisseCafe = async (collegues) => {
    for (const collegue of collegues) {
      const totalConsomme = caisseCafe
        .filter((item) => item.collegue === collegue)
        .reduce((total, item) => total + Number(item.total || 0), 0);
      const soldeExistant = caisseCafeSoldes.find(
        (item) => item.collegue === collegue
      );

      if (!soldeExistant) continue;

      const soldeRestant = Math.max(
        Number(soldeExistant.solde || 0) - totalConsomme,
        0
      );

      const { error } = await supabase
        .from("caisse_cafe_soldes")
        .update({
          solde: soldeRestant,
          updated_by: currentUser?.username || "Inconnu",
        })
        .eq("id", soldeExistant.id);

      if (error) {
        alert("Erreur calcul solde restant : " + error.message);
        return false;
      }
    }

    return true;
  };

  const resetCaisseCafe = async () => {
    if (currentUser?.role === "MEMBRE") {
      alert("Seul un administrateur peut faire un reset.");
      return;
    }

    const confirmation = window.confirm(
      "Remettre les consommations à zéro, conserver le solde restant réel, puis ajouter un café à 2 € à chaque collègue ?"
    );

    if (!confirmation) return;

    const soldesOk = await enregistrerSoldesRestantsCaisseCafe(
      colleguesApplication
    );

    if (!soldesOk) return;

    const { error: deleteError } = await supabase
      .from("caisse_cafe")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      alert("Erreur reset caisse café : " + deleteError.message);
      return;
    }

    const resetId = String(Date.now());
    const lignesCafe = colleguesApplication.map((collegue) => ({
      collegue,
      produit: "cafe",
      produit_label: "Café",
      quantite: 1,
      prix_unitaire: 2,
      total: 2,
      created_by: currentUser?.username || "Inconnu",
      reset_id: resetId,
    }));

    const { error: insertError } = await supabase
      .from("caisse_cafe")
      .insert(lignesCafe);

    if (insertError) {
      alert("Erreur ajout cafés après reset : " + insertError.message);
      return;
    }

    await chargerCaisseCafe();
    await chargerCaisseCafeSoldes();
    for (const collegue of colleguesApplication) {
      await desactiverRappelCaisseCafe(collegue);
    }
    ajouterHistorique(
      "Remise à zéro caisse café : solde restant conservé et café à 2 € pour chaque collègue",
      "caisse_cafe"
    );
  };

  const resetCaisseCafeCollegue = async (collegue) => {
    if (currentUser?.role === "MEMBRE") {
      alert("Seul un administrateur peut faire une remise à zéro.");
      return;
    }

    const confirmation = window.confirm(
      `Remettre à zéro les consommations de ${collegue} ? Son solde positif sera conservé.`
    );

    if (!confirmation) return;

    const soldesOk = await enregistrerSoldesRestantsCaisseCafe([collegue]);

    if (!soldesOk) return;

    const { error } = await supabase
      .from("caisse_cafe")
      .delete()
      .eq("collegue", collegue);

    if (error) {
      alert("Erreur remise à zéro collègue : " + error.message);
      return;
    }

    await chargerCaisseCafe();
    await chargerCaisseCafeSoldes();
    await desactiverRappelCaisseCafe(collegue);
    ajouterHistorique(
      `Remise à zéro caisse café individuelle : ${collegue}`,
      "caisse_cafe"
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

const email =
  loginClean === "tolier"
    ? "tayeb.berkouk.tbt@gmail.com"
    : `${loginClean}@oeildesauron.com`;

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

  if (error) {
    alert("Identifiant ou mot de passe incorrect.");
    return;
  }

let { data: profil, error: profilError } = await supabase
  .from("users")
  .select("*")
  .eq("auth_email", email)
  .maybeSingle();

if (!profil && !profilError) {
  const fallback = await supabase
    .from("users")
    .select("*")
    .eq("username", loginClean)
    .maybeSingle();

  profil = fallback.data;
  profilError = fallback.error;
}

if (profilError || !profil) {
  await supabase.auth.signOut();
  alert("Connexion réussie, mais profil utilisateur introuvable.");
  return;
}

  setSession(data.session);
  setCurrentUser(profil);
  setRappelCafeVu(false);
  setLogged(true);
  setPage("home");
};

  const deconnexion = async () => {
  await supabase.auth.signOut();

  setLogged(false);
  setCurrentUser(null);
  setSession(null);
  setRappelCafeVu(false);
  setUsername("");
  setPassword("");
  setPage("home");
};

  const renderHistoriqueFaitsIdentite = (identiteId = null) => {
    const faitsHistorique = identiteId
      ? faitsIdentites.filter(
          (item) => String(item.identite_id) === String(identiteId)
        )
      : faitsIdentiteEnCreation;

    return (
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

            {identiteId ? (
              currentUser?.role !== "MEMBRE" && (
                <button
                  className="delete-btn"
                  onClick={() => supprimerFaitIdentite(item.id)}
                >
                  Supprimer
                </button>
              )
            ) : (
              <button
                className="delete-btn"
                onClick={() => supprimerFaitIdentiteEnCreation(item.id)}
              >
                Supprimer
              </button>
            )}
          </div>
        ))}

        <div className="date-field">
          <span>Date du fait</span>
          <input
            id="nouveau-fait-date"
            type="date"
            value={nouveauFaitDate}
            onChange={(e) => setNouveauFaitDate(e.target.value)}
          />
        </div>

        <textarea
          placeholder="Nouveau fait"
          value={nouveauFaitDescription}
          onChange={(e) => setNouveauFaitDescription(e.target.value)}
        />

        <button
          className="admin-main-btn"
          onClick={() =>
            identiteId
              ? ajouterFaitIdentite(identiteId)
              : ajouterFaitIdentiteEnCreation()
          }
        >
          Ajouter un fait
        </button>
      </div>
    );
  };

  const resetIdentityForm = () => {
    setEditingId(null);
    setNom("");
    setPrenom("");
    setDuplicateIdentityWarningKey("");
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
    setFaitsIdentiteEnCreation([]);
    setNouveauFaitDate("");
    setNouveauFaitDescription("");
  };

  const trouverDoublonIdentite = () => {
    const nomClean = normaliserTexteIdentite(nom);
    const prenomClean = normaliserTexteIdentite(prenom);

    if (editingId || !nomClean || !prenomClean) return null;

    const identiteExistante = identites.find((item) => {
      return (
        normaliserTexteIdentite(item.nom) === nomClean &&
        normaliserTexteIdentite(item.prenom) === prenomClean
      );
    });

    if (!identiteExistante) return null;

    return {
      key: `${nomClean}|${prenomClean}`,
      identite: identiteExistante,
    };
  };

  const alerterDoublonIdentite = () => {
    const doublon = trouverDoublonIdentite();

    if (!doublon || duplicateIdentityWarningKey === doublon.key) return;

    alert(
      "Attention identité existante, vérifiez s'il ne s'agit pas d'un homonyme."
    );
    setDuplicateIdentityWarningKey(doublon.key);
  };

  const enregistrerIdentite = async () => {
  if (!nom && !prenom && !alias) {
    alert("Renseigne au moins un nom, un prénom ou un alias.");
    return;
  }

  const doublonIdentite = trouverDoublonIdentite();

  if (doublonIdentite && duplicateIdentityWarningKey !== doublonIdentite.key) {
    const continuer = window.confirm(
      "Attention identité existante, vérifiez s'il ne s'agit pas d'un homonyme."
    );

    if (!continuer) return;
    setDuplicateIdentityWarningKey(doublonIdentite.key);
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

  if (!editingId && identiteId && faitsIdentiteEnCreation.length > 0) {
    const { error: faitsError } = await supabase.from("faits_identites").insert(
      faitsIdentiteEnCreation.map((item) => ({
        identite_id: identiteId,
        date_fait: item.date_fait,
        description: item.description,
        created_by: item.created_by || currentUser?.username || "",
      }))
    );

    if (faitsError) {
      alert("Identité enregistrée, mais erreur ajout historique des faits : " + faitsError.message);
      return;
    }

    await chargerFaitsIdentites();
  }

  if (retourIdentiteInterpellation) {
    setInterpellationAuteurs((auteurs) => [
      ...new Set([...auteurs, libelleIdentite]),
    ]);
    setRetourIdentiteInterpellation(false);
    resetIdentityForm();
    setPage("interpellations");
    return;
  }

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
    setDuplicateVehiculeWarningKey("");
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

  const trouverDoublonVehicule = () => {
    const plaqueClean = normaliserPlaque(vehiculePlaque);

    if (editingVehiculeId || !plaqueClean) return null;

    const vehiculeExistant = vehicules.find((item) => {
      return normaliserPlaque(item.plaque) === plaqueClean;
    });

    if (!vehiculeExistant) return null;

    return {
      key: plaqueClean,
      vehicule: vehiculeExistant,
    };
  };

  const alerterDoublonVehicule = () => {
    const doublon = trouverDoublonVehicule();

    if (!doublon || duplicateVehiculeWarningKey === doublon.key) return;

    alert(
      "Attention immatriculation existante, vérifiez s'il ne s'agit pas du même véhicule ou d'une erreur de saisie."
    );
    setDuplicateVehiculeWarningKey(doublon.key);
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

  const doublonVehicule = trouverDoublonVehicule();

  if (doublonVehicule && duplicateVehiculeWarningKey !== doublonVehicule.key) {
    const continuer = window.confirm(
      "Attention immatriculation existante, vérifiez s'il ne s'agit pas du même véhicule ou d'une erreur de saisie."
    );

    if (!continuer) return;
    setDuplicateVehiculeWarningKey(doublonVehicule.key);
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

  const getAuthorizationHeaders = async () => {
    const activeSession =
      session || (await supabase.auth.getSession()).data.session;

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${activeSession?.access_token || ""}`,
    };
  };

  const enregistrerUtilisateur = async () => {
  if (!newUsername || !newPassword || !newRole) {
    alert("Identifiant, mot de passe et rôle obligatoires.");
    return;
  }

  const usernameClean = newUsername.trim().toLowerCase();

  if (editingUser) {
    const response = await fetch("/api/update-user", {
      method: "POST",
      headers: await getAuthorizationHeaders(),
      body: JSON.stringify({
        originalUsername: editingUser,
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
      alert("Erreur modification utilisateur : " + result.error);
      return;
    }

    await chargerUtilisateurs();
    await ajouterHistorique(
      `Modification utilisateur : ${usernameClean} (${newRole})`,
      "utilisateur",
      usernameClean
    );
    resetUserForm();
    alert("Utilisateur modifié.");
    return;
  }

  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: await getAuthorizationHeaders(),
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
  await ajouterHistorique(
    `Création utilisateur : ${usernameClean} (${newRole})`,
    "utilisateur",
    usernameClean
  );
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

  const response = await fetch("/api/delete-user", {
    method: "POST",
    headers: await getAuthorizationHeaders(),
    body: JSON.stringify({ username }),
  });

  const result = await response.json();

  if (!response.ok) {
    alert("Erreur suppression utilisateur : " + result.error);
    return;
  }

  await chargerUtilisateurs();

  alert("Utilisateur supprimé.");
};

  const rechercherParPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setRecherchePhotoError("");
    setRecherchePhotoLoading(true);
    setRecherchePhotoResults([]);

    try {
      const photoRecherche = await lireFichierEnDataUrl(file);
      const visageRecherche = await extraireDescripteurVisage(photoRecherche);

      if (!visageRecherche) {
        setRecherchePhoto(photoRecherche);
        setRecherchePhotoError("Aucun visage détecté sur cette photo.");
        return;
      }

      const candidats = [];

      for (const person of identites) {
        const photosPersonne = getPhotos(person);
        let meilleurScore = null;
        let meilleurePhoto = "";

        for (const photoPersonne of photosPersonne) {
          try {
            const visagePersonne = await extraireDescripteurVisage(photoPersonne);

            if (!visagePersonne) continue;

            const distance = faceapi.euclideanDistance(
              visageRecherche.descriptor,
              visagePersonne.descriptor
            );

            if (meilleurScore === null || distance < meilleurScore.distance) {
              meilleurScore = {
                distance,
                detection: visagePersonne.detection?.score || 0,
              };
              meilleurePhoto = photoPersonne;
            }
          } catch {
            // Certaines anciennes images peuvent ne pas être lisibles par le moteur visage.
          }
        }

        if (meilleurScore) {
          candidats.push({
            ...person,
            photoResultat: meilleurePhoto,
            proximite: calculerScoreVisage(meilleurScore.distance),
            distanceVisage: meilleurScore.distance,
            niveauCorrespondance: getNiveauCorrespondance(meilleurScore.distance),
          });
        }
      }

      setRecherchePhoto(photoRecherche);
      setRecherchePhotoResults(
        candidats
          .sort((a, b) => a.distanceVisage - b.distanceVisage)
          .slice(0, 12)
      );
    } catch {
      setRecherchePhotoError("Impossible d'analyser cette photo avec le moteur visage.");
    } finally {
      setRecherchePhotoLoading(false);
    }
  };

  const resetRecherchePhoto = () => {
    setRecherchePhoto("");
    setRecherchePhotoResults([]);
    setRecherchePhotoError("");
    setRecherchePhotoLoading(false);
  };

  const results = trierIdentitesParNom([...fakePeople, ...identites].filter((person) => {
    const fullText = `
      ${person.nom || ""}
      ${person.prenom || ""}
      ${person.alias || ""}
      ${person.secteur || ""}
      ${person.faits || ""}
      ${person.observations || ""}
    `.toLowerCase();

    return fullText.includes(search.toLowerCase());
  }));

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

        <div className="photo-search-panel">
          <h3>Recherche par photo</h3>

          <div className="photo-buttons">
            <label className="photo-btn">
              Prendre une photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={rechercherParPhoto}
              />
            </label>

            <label className="photo-btn">
              Galerie photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={rechercherParPhoto}
              />
            </label>
          </div>

          {recherchePhoto && (
            <div className="photo-search-preview">
              <img
                src={recherchePhoto}
                alt="photo recherchée"
                className="photo-search-img"
                onClick={() => setPhotoZoom(recherchePhoto)}
              />

              <button className="delete-btn" onClick={resetRecherchePhoto}>
                Effacer
              </button>
            </div>
          )}

          {recherchePhotoLoading && (
            <p>Détection du visage et comparaison en cours...</p>
          )}
          {recherchePhotoError && <p>{recherchePhotoError}</p>}
        </div>

        {recherchePhoto && !recherchePhotoLoading && (
          <div className="photo-search-results">
            <h3>Résultats photo</h3>

            {recherchePhotoResults.length === 0 && (
              <div className="admin-card">
                Aucun visage comparable trouvé dans les photos enregistrées.
              </div>
            )}

            <div className="results-list">
              {recherchePhotoResults.map((person) => (
                <div
                  className="person-card"
                  key={`photo-${person.id}`}
                  onClick={() => {
                    setSelectedIdentity(person);
                    setIdentityDetailsReturnPage("search");
                    setPage("identityDetails");
                  }}
                >
                  <div className="avatar identity-photo">
                    <img
                      src={person.photoResultat || getPhotoPrincipale(person)}
                      alt="photo"
                      className="person-photo"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPhotoZoom(
                          person.photoResultat || getPhotoPrincipale(person)
                        );
                      }}
                    />
                  </div>

                  <div className="person-info">
                    <div className="person-name">
                      {person.nom} {person.prenom}
                    </div>
                    {person.alias && (
                      <div className="person-alias">Alias : {person.alias}</div>
                    )}
                    <div className="important-amount">
                      Score visage : {person.proximite}%
                    </div>
                    <div>Résultat : {person.niveauCorrespondance}</div>
                    <div>Distance technique : {person.distanceVisage.toFixed(3)}</div>
                    {person.secteur && (
                      <div>Secteur habituel : {person.secteur}</div>
                    )}
                    {person.faits && <div>Secteur faits : {person.faits}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {renderHistoriqueFaitsIdentite(person.id)}

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
            const personnes = trierIdentitesParNom(identites.filter((person) =>
              typeSecteur === "habituel"
                ? person.secteur === secteurNom
                : person.faits === secteurNom
            ));
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
            onBlur={alerterDoublonVehicule}
          />

          <input
            type="text"
            placeholder="Secteur concerné"
            value={vehiculeSecteur}
            onFocus={alerterDoublonVehicule}
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

            {trierIdentitesParNom(identites).map((person) => (
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

              <div className="date-field">
                <span>Date de naissance</span>
                <input
                  id="nouvelle-identite-naissance"
                  type="date"
                  value={nouvelleIdentiteNaissance}
                  onChange={(e) => setNouvelleIdentiteNaissance(e.target.value)}
                />
              </div>
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

          {trierIdentitesParNom(identites).map((person) => (
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
            if (retourIdentiteInterpellation) {
              setRetourIdentiteInterpellation(false);
              resetIdentityForm();
              setPage("interpellations");
              return;
            }

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
            onBlur={alerterDoublonIdentite}
          />

          <input
            type="text"
            placeholder="Alias"
            value={alias}
            onFocus={alerterDoublonIdentite}
            onChange={(e) => setAlias(e.target.value)}
          />

          <div className="date-field">
            <span>Date de naissance</span>
            <input
              id="identite-naissance"
              type="date"
              value={naissance}
              onChange={(e) => setNaissance(e.target.value)}
            />
          </div>
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

          {renderHistoriqueFaitsIdentite(editingId)}

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

          {retourIdentiteInterpellation && (
            <button
              className="edit-btn"
              type="button"
              onClick={ignorerIdentiteAuteurInterpellation}
            >
              Ignorer la création d'identité
            </button>
          )}

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
    const getHistoriqueUsername = (item) => item.username || item.utilisateur || "Inconnu";
    const getHistoriqueUserLabel = (usernameValue) => {
      const user = users.find(
        (item) => (item.username || "").toLowerCase() === (usernameValue || "").toLowerCase()
      );

      if (!user) return usernameValue || "Inconnu";

      return (
        `${user.grade || ""} ${user.nom || ""} ${user.prenom || ""}`.trim() ||
        user.username ||
        "Inconnu"
      );
    };
    const historiqueSearchClean = historiqueSearch.trim().toLowerCase();
    const historiqueFiltre = historique.filter((item) => {
      const usernameValue = getHistoriqueUsername(item);
      const texte = [
        item.action,
        item.details,
        item.type_objet,
        item.objet_id,
        usernameValue,
        getHistoriqueUserLabel(usernameValue),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !historiqueSearchClean || texte.includes(historiqueSearchClean);
      const matchUser =
        !historiqueSelectedUser || usernameValue === historiqueSelectedUser;

      return matchSearch && matchUser;
    });
    const historiquePourListe = historiqueSearchClean ? historiqueFiltre : historique;
    const historiqueParUser = historiquePourListe.reduce((acc, item) => {
      const usernameValue = getHistoriqueUsername(item);
      acc[usernameValue] = (acc[usernameValue] || 0) + 1;
      return acc;
    }, {});
    const utilisateursHistorique = Object.entries(historiqueParUser).sort((a, b) =>
      getHistoriqueUserLabel(a[0]).localeCompare(getHistoriqueUserLabel(b[0]), "fr", {
        sensitivity: "base",
      })
    );

    return (
      <div className="home-page">
        <button
          className="back-btn"
          onClick={() => {
            if (historiqueSelectedUser) {
              setHistoriqueSelectedUser("");
              return;
            }

            setPage("admin");
          }}
        >
          ← Retour
        </button>

        <h2 className="section-title">
          {historiqueSelectedUser
            ? `Historique ${getHistoriqueUserLabel(historiqueSelectedUser)}`
            : "Historique"}
        </h2>

        {currentUser && currentUser.role === "LE TÔLIER" && (
          <button className="delete-btn" onClick={viderHistorique}>
            Vider l'historique
          </button>
        )}

        <div className="admin-card">
          <input
            type="text"
            placeholder="Rechercher une action, un collègue, une fiche..."
            value={historiqueSearch}
            onChange={(e) => setHistoriqueSearch(e.target.value)}
          />
        </div>

        {!historiqueSelectedUser && (
          <div className="results-list">
            {utilisateursHistorique.length === 0 && (
              <div className="admin-card">Aucun historique.</div>
            )}

            {utilisateursHistorique.map(([usernameValue, count]) => (
              <div
                className="person-card"
                key={usernameValue}
                onClick={() => setHistoriqueSelectedUser(usernameValue)}
              >
                <div className="avatar">🕘</div>

                <div className="person-info">
                  <div className="person-name">
                    {getHistoriqueUserLabel(usernameValue)}
                  </div>
                  <div>Identifiant : {usernameValue}</div>
                  <div>Actions enregistrées : {count}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {historiqueSelectedUser && (
        <div className="results-list">
          {historiqueFiltre.length === 0 && (
            <div className="admin-card">Aucun historique.</div>
          )}

          {historiqueFiltre.map((item) => (
            <div className="person-card" key={item.id}>
              <div className="avatar">🕘</div>

              <div className="person-info">
                <div className="person-name">{item.action}</div>
                <div>
                  Utilisateur : {getHistoriqueUserLabel(getHistoriqueUsername(item))}
                </div>
                <div>Date : {formatDateFr(item.created_at) || item.date}</div>
                <div>Heure : {formatHeureFr(item.created_at) || item.heure}</div>
                {item.type_objet && <div>Type : {item.type_objet}</div>}
                {item.objet_id && <div>ID : {item.objet_id}</div>}
              </div>
            </div>
          ))}
        </div>
        )}
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

  if (page === "interpellations") {
    const getInterpellationDate = (item) => new Date(item.date_interpellation);
    const getInterpellationYear = (item) => getInterpellationDate(item).getFullYear();
    const getInterpellationMonth = (item) => getInterpellationDate(item).getMonth();
    const totalInterpelles = (items) =>
      items.reduce((total, item) => total + Number(item.nombre_interpelles || 0), 0);
    const statsInfractions = (items) => {
      const stats = items.reduce((acc, item) => {
        const infraction = item.infractions || "Infraction non renseignée";
        acc[infraction] = (acc[infraction] || 0) + Number(item.nombre_interpelles || 0);

        return acc;
      }, {});

      return Object.entries(stats).sort((a, b) =>
        a[0].localeCompare(b[0], "fr", { sensitivity: "base" })
      );
    };
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const annees = [
      ...new Set([
        currentYear,
        ...anneesInterpellationsAjoutees,
        ...interpellations.map((item) => getInterpellationYear(item)),
      ]),
    ].sort((a, b) => b - a);
    const interpellationsAnnee = selectedInterpellationYear
      ? interpellations.filter(
          (item) => getInterpellationYear(item) === selectedInterpellationYear
        )
      : [];
    const interpellationsMois =
      selectedInterpellationYear && selectedInterpellationMonth !== null
        ? interpellationsAnnee.filter(
            (item) => getInterpellationMonth(item) === selectedInterpellationMonth
          )
        : [];

    if (!selectedInterpellationYear) {
      return (
        <div className="home-page">
          <button className="back-btn" onClick={() => setPage("home")}>
            ← Retour
          </button>

          <h2 className="section-title">Interpellations</h2>

          <button className="admin-main-btn" onClick={ajouterAnneeInterpellation}>
            Ajouter une année
          </button>

          <div className="results-list">
            {annees.map((annee) => {
              const fichesAnnee = interpellations.filter(
                (item) => getInterpellationYear(item) === annee
              );
              const stats = statsInfractions(fichesAnnee);

              return (
                <div
                  className="person-card"
                  key={annee}
                  onClick={() => setSelectedInterpellationYear(annee)}
                >
                  <div className="avatar">📅</div>

                  <div className="person-info">
                    <div className="person-name">{annee}</div>
                    <div className="important-amount">
                      Total interpellés : {totalInterpelles(fichesAnnee)}
                    </div>
                    {stats.length === 0 && <div>Aucune infraction enregistrée.</div>}
                    {stats.map(([infraction, total]) => (
                      <div key={infraction}>
                        {infraction} : {total}
                      </div>
                    ))}
                    {(currentUser?.role === "LE TÔLIER" ||
                      currentUser?.role === "ADMINISTRATEUR") && (
                      <div className="person-actions">
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            supprimerAnneeInterpellation(annee);
                          }}
                        >
                          Supprimer l'année
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (selectedInterpellationMonth === null) {
      return (
        <div className="home-page">
          <button
            className="back-btn"
            onClick={() => setSelectedInterpellationYear(null)}
          >
            ← Retour
          </button>

          <h2 className="section-title">Interpellations {selectedInterpellationYear}</h2>

          <div className="admin-card">
            <h3>Décompte annuel</h3>
            <p>Total interpellés : {totalInterpelles(interpellationsAnnee)}</p>
            {statsInfractions(interpellationsAnnee).map(([infraction, total]) => (
              <p key={infraction}>
                {infraction} : {total}
              </p>
            ))}
          </div>

          <div className="results-list">
            {MOIS_FR.map((mois, index) => {
              const fichesMois = interpellationsAnnee.filter(
                (item) => getInterpellationMonth(item) === index
              );
              const statsMois = statsInfractions(fichesMois);
              const moisEnCours =
                selectedInterpellationYear === currentYear && index === currentMonth;

              return (
                <div
                  className={`person-card ${moisEnCours ? "current-month-card" : ""}`}
                  key={mois}
                  onClick={() => {
                    setSelectedInterpellationMonth(index);
                    setEditingInterpellationId(null);
                    setInterpellationDate(
                      `${selectedInterpellationYear}-${String(index + 1).padStart(2, "0")}-01`
                    );
                    setInterpellationType("initiative");
                    setInterpellationAuteurNom("");
                    setInterpellationAuteurPrenom("");
                    setInterpellationAuteurs([]);
                    setInterpellationInfractions("");
                    setInterpellationNombre("");
                  }}
                >
                  <div className="avatar">🗓️</div>

                  <div className="person-info">
                    <div className="person-name">{mois}</div>
                    {moisEnCours && (
                      <div className="current-month-label">Mois en cours</div>
                    )}
                    <div>Nombre de fiches : {fichesMois.length}</div>
                    <div className="important-amount">
                      Interpellés : {totalInterpelles(fichesMois)}
                    </div>
                    {statsMois.length === 0 && <div>Aucune infraction enregistrée.</div>}
                    {statsMois.map(([infraction, total]) => (
                      <div key={infraction}>
                        {infraction} : {total}
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

    return (
      <div className="home-page">
        <button
          className="back-btn"
          onClick={() => {
            setSelectedInterpellationMonth(null);
            resetInterpellationForm();
          }}
        >
          ← Retour
        </button>

        <h2 className="section-title">
          {MOIS_FR[selectedInterpellationMonth]} {selectedInterpellationYear}
        </h2>

        <div className="admin-card">
          <h3>Décompte du mois</h3>
          <p>Total interpellés : {totalInterpelles(interpellationsMois)}</p>
          {statsInfractions(interpellationsMois).map(([infraction, total]) => (
            <p key={infraction}>
              {infraction} : {total}
            </p>
          ))}
        </div>

        <div className="admin-card">
          <h3>{editingInterpellationId ? "Modifier une fiche" : "Ajouter une fiche"}</h3>

          <div className="date-field">
            <span>Date</span>
            <input
              id="interpellation-date"
              type="date"
              value={interpellationDate}
              onChange={(e) => setInterpellationDate(e.target.value)}
            />
          </div>

          <select
            className="role-select"
            value={interpellationType}
            onChange={(e) => setInterpellationType(e.target.value)}
          >
            <option value="initiative">Initiative</option>
            <option value="requisition">Réquisition</option>
          </select>

          <input
            type="text"
            placeholder="Nom de l'auteur"
            value={interpellationAuteurNom}
            onChange={(e) => setInterpellationAuteurNom(e.target.value)}
          />

          <input
            type="text"
            placeholder="Prénom de l'auteur"
            value={interpellationAuteurPrenom}
            onChange={(e) => setInterpellationAuteurPrenom(e.target.value)}
          />

          <button className="edit-btn" onClick={ouvrirIdentiteAuteurInterpellation}>
            Ajouter auteur
          </button>

          {interpellationAuteurs.length > 0 && (
            <div className="results-list">
              {interpellationAuteurs.map((auteur, index) => (
                <div className="user-line" key={`${auteur}-${index}`}>
                  <strong>{auteur}</strong>
                  <button
                    className="delete-btn"
                    onClick={() => supprimerAuteurInterpellation(index)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            placeholder="Infractions"
            value={interpellationInfractions}
            onChange={(e) => setInterpellationInfractions(e.target.value)}
          />

          <input
            type="number"
            min="1"
            placeholder="Nombre d'interpellés"
            value={interpellationNombre}
            onChange={(e) => setInterpellationNombre(e.target.value)}
          />

          <button className="admin-main-btn" onClick={enregistrerInterpellation}>
            {editingInterpellationId ? "Enregistrer modification" : "Ajouter"}
          </button>

          {editingInterpellationId && (
            <button className="cancel-btn" onClick={resetInterpellationForm}>
              Annuler modification
            </button>
          )}
        </div>

        <div className="admin-card">
          <h3>Fiches du mois</h3>

          {interpellationsMois.length === 0 && <p>Aucune fiche enregistrée.</p>}

          {interpellationsMois.map((item) => (
            <div className="user-line" key={item.id}>
              <div>
                <strong>
                  {formatDateFr(item.date_interpellation)} — {item.type === "requisition" ? "Réquisition" : "Initiative"}
                </strong>
                <br />
                Auteur(s) : {item.auteur_nom} {item.auteur_prenom}
                <br />
                Infractions : {item.infractions}
                <br />
                Nombre d'interpellés : {item.nombre_interpelles}
              </div>

              <div className="user-buttons">
                <button
                  className="edit-btn"
                  onClick={() => modifierInterpellation(item)}
                >
                  Modifier
                </button>

                <button
                  className="delete-btn"
                  onClick={() => supprimerInterpellation(item.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "p4") {
    const selectedDate = parseDateLocale(p4Date) || new Date();
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const joursAffiches =
      p4Vue === "annee"
        ? Array.from({ length: 12 }, (_, monthIndex) => ({
            monthIndex,
            days: getMonthDays(selectedYear, monthIndex),
          }))
        : p4Vue === "semaine"
          ? [{ monthIndex: selectedMonth, days: getWeekDays(selectedDate) }]
          : [{ monthIndex: selectedMonth, days: getMonthDays(selectedYear, selectedMonth) }];
    const p4ListeVisible = peutGererP4
      ? p4Conges
      : p4Conges.filter((item) => item.created_by === currentUser?.username);
    const p4DemandesUrgentes = p4Conges.filter((item) =>
      ["demande", "previsionnel"].includes(item.statut)
    );
    const p4DemandesEnCours = p4DemandesUrgentes.filter(
      (item) => getP4Nature(item) === "demande"
    );
    const p4PrevisionnelsEnCours = p4DemandesUrgentes.filter(
      (item) => getP4Nature(item) === "previsionnel"
    );
    const p4EnregistreParCollegue = [...p4ListeVisible]
      .sort((a, b) => {
        const collegueCompare = getP4CollegueLabel(a.collegue).localeCompare(
          getP4CollegueLabel(b.collegue),
          "fr",
          { sensitivity: "base" }
        );
        if (collegueCompare !== 0) return collegueCompare;
        return (a.date_debut || "").localeCompare(b.date_debut || "");
      })
      .reduce((groups, item) => {
        const collegue = getP4CollegueLabel(item.collegue) || "Collègue inconnu";
        let collegueGroup = groups.find((group) => group.label === collegue);

        if (!collegueGroup) {
          collegueGroup = { label: collegue, items: [] };
          groups.push(collegueGroup);
        }

        collegueGroup.items.push(item);
        return groups;
      }, []);
    const relanceP4RefusEnEdition =
      editingP4Item?.statut === "refuse" && !peutGererP4;
    const congesDuJour = (date, cycle) =>
      p4Conges.filter(
        (item) =>
          item.statut === "valide" &&
          cycle.isWorking &&
          isDateInRange(date, item.date_debut, item.date_fin)
      );
    const statutLabel = {
      demande: "Demande",
      previsionnel: "Prévisionnel",
      valide: "Validé",
      refuse: "Refusé",
    };
    const renderP4Carte = (item, options = {}) => (
      <div
        className={`user-line p4-request ${item.statut} ${getP4Nature(item)}`}
        key={item.id}
      >
        <div>
          <strong>
            {getP4CollegueLabel(item.collegue)} — {getP4TypeCourt(item.type)}
          </strong>
          <br />
          {formatDateFr(item.date_debut)} au {formatDateFr(item.date_fin)}
          <br />
          Nature : {getP4NatureLabel(item)}
          <br />
          Demandé le : {formatDateFr(item.created_at)} à {formatHeureFr(item.created_at)}
          {item.created_by && (
            <>
              <br />
              Par : {item.created_by}
            </>
          )}
          <br />
          Statut : {statutLabel[item.statut] || item.statut}
          {item.commentaire && (
            <>
              <br />
              {item.commentaire}
            </>
          )}
        </div>

        {peutModifierP4Item(item) && (
          <div className="user-buttons">
            <button className="edit-btn" onClick={() => modifierP4Conge(item)}>
              Modifier
            </button>
            {peutGererP4 && options.showDecisionButtons && (
              <>
                <button
                  className="edit-btn"
                  onClick={() => changerStatutP4Conge(item, "valide")}
                >
                  Valider
                </button>
                <button
                  className="delete-btn"
                  onClick={() => changerStatutP4Conge(item, "refuse")}
                >
                  Refuser
                </button>
              </>
            )}
            {peutGererP4 && options.showStoredButtons && (
              <>
                {item.statut === "refuse" && (
                  <button
                    className="edit-btn"
                    onClick={() => changerStatutP4Conge(item, "valide")}
                  >
                    Valider
                  </button>
                )}
                <button className="delete-btn" onClick={() => supprimerP4Conge(item)}>
                  Supprimer
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("vieGroupe")}>
          ← Retour
        </button>

        <h2 className="section-title">P4</h2>

        <div className="p4-alert-card">
          <strong>{p4DemandesUrgentes.length}</strong>
          <span>demande(s) ou prévisionnel(s) à suivre</span>
        </div>

        <div className="sector-switch">
          <button
            className={p4Vue === "annee" ? "active-sector" : ""}
            onClick={() => setP4Vue("annee")}
          >
            Année
          </button>
          <button
            className={p4Vue === "mois" ? "active-sector" : ""}
            onClick={() => setP4Vue("mois")}
          >
            Mois
          </button>
          <button
            className={p4Vue === "semaine" ? "active-sector" : ""}
            onClick={() => setP4Vue("semaine")}
          >
            Semaine
          </button>
        </div>

        <div className="date-field">
          <span>Période affichée</span>
          <input
            type="date"
            value={p4Date}
            onChange={(e) => setP4Date(e.target.value)}
          />
        </div>

        <div className="p4-legend">
          <span className="p4-dot p4-work"></span> Travail
          <span className="p4-dot p4-rest"></span> Repos
          <span className="p4-badge demande">Demande</span>
          <span className="p4-badge previsionnel">Prévisionnel</span>
          <span className="p4-badge valide">Validé</span>
        </div>

        <div className="p4-calendar">
          {joursAffiches.map((group) => (
            <div className="p4-month" key={`${p4Vue}-${group.monthIndex}`}>
              {p4Vue === "annee" && <h3>{MOIS_FR[group.monthIndex]}</h3>}

              <div className={`p4-grid ${p4Vue === "annee" ? "year" : ""} ${p4Vue === "semaine" ? "week" : ""}`}>
                {group.days.map((day) => {
                  const cycle = getP4CycleInfo(day);
                  const lignesJour = congesDuJour(day, cycle);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      className={`p4-day ${cycle.isWorking ? "work" : "rest"} ${isToday ? "today" : ""}`}
                      key={toDateInputValue(day)}
                    >
                      <div className="p4-day-head">
                        <strong>{day.getDate()}</strong>
                        <span>{cycle.isWorking ? "Travail" : "Repos"}</span>
                      </div>

                      {lignesJour.map((item) => (
                        <div
                          className={`p4-entry ${item.statut} ${getP4Nature(item)}`}
                          key={`${item.id}-${toDateInputValue(day)}`}
                        >
                          <strong>{getP4CollegueLabel(item.collegue)}</strong>
                          <span>{getP4TypeCourt(item.type)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="admin-card">
          <h3>
            {editingP4Id
              ? relanceP4RefusEnEdition
                ? "Relancer la demande"
                : "Modifier P4"
              : p4FormMode === "previsionnel"
                ? "Prévisionnel"
                : "Demande de congé"}
          </h3>

          {(!editingP4Id || relanceP4RefusEnEdition) && (
            <div className="p4-form-mode">
              <button
                className={p4FormMode === "demande" ? "active" : ""}
                onClick={() => changerModeP4("demande")}
              >
                Demande
              </button>
              <button
                className={p4FormMode === "previsionnel" ? "active" : ""}
                onClick={() => changerModeP4("previsionnel")}
              >
                Prévisionnel
              </button>
            </div>
          )}

          <select
            className="role-select"
            value={p4Collegue}
            onChange={(e) => setP4Collegue(e.target.value)}
            disabled={!peutGererP4}
          >
            <option value="">
              {peutGererP4 ? "Collègue" : collegueP4Utilisateur || "Compte non reconnu"}
            </option>
            {colleguesApplication.map((collegue) => (
              <option key={collegue} value={collegue}>
                {collegue}
              </option>
            ))}
          </select>

          {editingP4Id && peutGererP4 && (
            <select
              className="role-select"
              value={p4EditionStatut}
              onChange={(e) => setP4EditionStatut(e.target.value)}
            >
              <option value="demande">Demande</option>
              <option value="previsionnel">Prévisionnel</option>
              <option value="valide">Validé</option>
              <option value="refuse">Refusé</option>
            </select>
          )}

          {p4Periodes.map((periode, index) => (
            <div className="p4-period-card" key={periode.tempId}>
              <div className="p4-period-head">
                <strong>Période {index + 1}</strong>
                {p4Periodes.length > 1 && (
                  <button
                    className="delete-btn"
                    onClick={() => retirerP4Periode(periode.tempId)}
                  >
                    Retirer
                  </button>
                )}
              </div>

              <select
                className="role-select"
                value={periode.type}
                onChange={(e) =>
                  modifierP4Periode(periode.tempId, "type", e.target.value)
                }
              >
                {TYPES_CONGES_P4.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <div className="date-field">
                <span>Début</span>
                <input
                  type="date"
                  value={periode.date_debut}
                  onChange={(e) =>
                    modifierP4Periode(periode.tempId, "date_debut", e.target.value)
                  }
                />
              </div>

              <div className="date-field">
                <span>Fin</span>
                <input
                  type="date"
                  value={periode.date_fin}
                  onChange={(e) =>
                    modifierP4Periode(periode.tempId, "date_fin", e.target.value)
                  }
                />
              </div>

              <textarea
                placeholder="Commentaire"
                value={periode.commentaire}
                onChange={(e) =>
                  modifierP4Periode(periode.tempId, "commentaire", e.target.value)
                }
              />
            </div>
          ))}

          {!editingP4Id && (
            <button className="cancel-btn" onClick={ajouterP4Periode}>
              Ajouter une période
            </button>
          )}

          <button className="admin-main-btn" onClick={enregistrerP4Conge}>
            {editingP4Id
              ? "Enregistrer modification"
              : p4FormMode === "previsionnel"
                ? "Envoyer le prévisionnel"
                : "Envoyer la demande"}
          </button>

          {editingP4Id && (
            <button className="cancel-btn" onClick={resetP4Form}>
              Annuler modification
            </button>
          )}

          {!editingP4Id && (
            <button className="cancel-btn" onClick={resetP4Form}>
              Annuler la demande
            </button>
          )}
        </div>

        <div className="admin-card">
          <h3>Demandes et prévisionnels</h3>

          {p4DemandesUrgentes.length === 0 && <p>Aucune demande en attente.</p>}

          <div className="p4-columns">
            <div className="p4-column">
              <h4>Demandes</h4>
              {p4DemandesEnCours.length === 0 && <p>Aucune demande.</p>}
              {p4DemandesEnCours.map((item) =>
                renderP4Carte(item, { showDecisionButtons: true })
              )}
            </div>

            <div className="p4-column">
              <h4>Prévisionnels</h4>
              {p4PrevisionnelsEnCours.length === 0 && <p>Aucun prévisionnel.</p>}
              {p4PrevisionnelsEnCours.map((item) =>
                renderP4Carte(item, { showDecisionButtons: true })
              )}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3>P4 enregistré</h3>

          {p4ListeVisible.length === 0 && <p>Aucune ligne P4 enregistrée.</p>}

          {p4EnregistreParCollegue.map((collegueGroup) => (
            <div className="p4-colleague-group" key={collegueGroup.label}>
              <h4>{collegueGroup.label}</h4>
              {collegueGroup.items.map((item) =>
                renderP4Carte(item, { showStoredButtons: true })
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "caisseCafe") {
    const peutGererCaisseCafe =
      currentUser?.role === "LE TÔLIER" ||
      currentUser?.role === "ADMINISTRATEUR";
    const resumeCaisseCafe = colleguesApplication.map((collegue) => {
      const consommations = caisseCafe.filter((item) => item.collegue === collegue);
      const totalConsomme = consommations.reduce(
        (total, item) => total + Number(item.total || 0),
        0
      );
      const solde =
        Number(
          caisseCafeSoldes.find((item) => item.collegue === collegue)?.solde || 0
        );
      const quantites = produitsCaisseCafe.reduce((acc, produit) => {
        acc[produit.value] = consommations
          .filter((item) => item.produit === produit.value)
          .reduce((total, item) => total + Number(item.quantite || 0), 0);

        return acc;
      }, {});

      return {
        collegue,
        totalConsomme,
        solde,
        resteAPayer: Math.max(totalConsomme - solde, 0),
        soldeRestant: Math.max(solde - totalConsomme, 0),
        quantites,
      };
    });
    const totalResteAPayer = resumeCaisseCafe.reduce(
      (total, item) => total + item.resteAPayer,
      0
    );

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("vieGroupe")}>
          ← Retour
        </button>

        <h2 className="section-title">Caisse café</h2>

        <div className="admin-card">
          <h3>{editingCaisseCafeId ? "Modifier" : "Ajouter"}</h3>

          <select
            className="role-select"
            value={caisseCafeCollegue}
            onChange={(e) => setCaisseCafeCollegue(e.target.value)}
          >
            <option value="">Choisir un collègue</option>
            {colleguesApplication.map((collegue) => (
              <option key={collegue} value={collegue}>
                {collegue}
              </option>
            ))}
          </select>

          <select
            className="role-select"
            value={caisseCafeProduit}
            onChange={(e) => changerProduitCaisseCafe(e.target.value)}
          >
            <option value="">Choisir un produit</option>
            {produitsCaisseCafe.filter((produit) => produit.value !== "cafe").map((produit) => (
              <option key={produit.value} value={produit.value}>
                {produit.label}
              </option>
            ))}
          </select>

          <label className="form-label">Quantité</label>
          <input
            type="number"
            min="1"
            placeholder="Quantité"
            value={caisseCafeQuantite}
            onChange={(e) => setCaisseCafeQuantite(e.target.value)}
          />

          <label className="form-label">Prix unitaire</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Prix unitaire"
            value={caisseCafePrix}
            onChange={(e) => setCaisseCafePrix(e.target.value)}
          />

          <button className="admin-main-btn" onClick={enregistrerConsommationCaisseCafe}>
            {editingCaisseCafeId ? "Enregistrer modification" : "Ajouter"}
          </button>

          {editingCaisseCafeId && (
            <button className="cancel-btn" onClick={annulerModificationCaisseCafe}>
              Annuler modification
            </button>
          )}
        </div>

        <div className="admin-card">
          <h3>Résumé</h3>
          <p>Total des sommes dues : {formatMontantEuro(totalResteAPayer)}</p>
        </div>

        <div className="results-list">
          {resumeCaisseCafe.map((item) => (
            <div className="person-card" key={item.collegue}>
              <div className="avatar">☕</div>

              <div className="person-info">
                <div className="person-name">{item.collegue}</div>
                <div>Total consommé : {formatMontantEuro(item.totalConsomme)}</div>
                <div>Solde positif : {formatMontantEuro(item.solde)}</div>
                <div className="important-amount">Reste à payer : {formatMontantEuro(item.resteAPayer)}</div>
                {item.soldeRestant > 0 && (
                  <div>Solde restant après consommation : {formatMontantEuro(item.soldeRestant)}</div>
                )}

                {produitsCaisseCafe.map((produit) => (
                  <div key={produit.value}>
                    {produit.label} : {item.quantites[produit.value]}
                  </div>
                ))}

                {peutGererCaisseCafe && (
                  <div className="user-buttons">
                    <button
                      className="delete-btn"
                      onClick={() => resetCaisseCafeCollegue(item.collegue)}
                    >
                      Remise à zéro
                    </button>

                    <button
                      className="edit-btn"
                      onClick={() => activerRappelCaisseCafe(item.collegue)}
                    >
                      Rappel paiement
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {peutGererCaisseCafe && (
          <div className="admin-card">
            <h3>Modifier un solde positif</h3>

            <select
              className="role-select"
              value={soldeCafeCollegue}
              onChange={(e) => setSoldeCafeCollegue(e.target.value)}
            >
              {colleguesApplication.map((collegue) => (
                <option key={collegue} value={collegue}>
                  {collegue}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Solde positif"
              value={soldeCafeMontant}
              onChange={(e) => setSoldeCafeMontant(e.target.value)}
            />

            <button className="admin-main-btn" onClick={modifierSoldeCaisseCafe}>
              Modifier le solde
            </button>

            <h3>Ajouter un produit</h3>

            <input
              type="text"
              placeholder="Nom du produit"
              value={nouveauProduitCafeNom}
              onChange={(e) => setNouveauProduitCafeNom(e.target.value)}
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Prix"
              value={nouveauProduitCafePrix}
              onChange={(e) => setNouveauProduitCafePrix(e.target.value)}
            />

            <button className="admin-main-btn" onClick={ajouterProduitCaisseCafe}>
              Ajouter produit
            </button>

            <button className="delete-btn" onClick={resetCaisseCafe}>
              Remise à zéro + café 2 €
            </button>
          </div>
        )}

        <div className="admin-card">
          <h3>Historique des consommations</h3>

          {caisseCafe.length === 0 && <p>Aucune consommation enregistrée.</p>}

          {caisseCafe.map((item) => (
            <div className="user-line" key={item.id}>
              <div>
                <strong>
                  {item.collegue} — {item.produit_label || item.produit} x{item.quantite}
                </strong>
                <br />
                {formatMontantEuro(item.total)} le {formatDateFr(item.created_at)} à{" "}
                {formatHeureFr(item.created_at)}
                <br />
                Ajouté par : {item.created_by || "Inconnu"}
              </div>

              {peutGererCaisseCafe && (
                <div className="user-buttons">
                  <button
                    className="edit-btn"
                    onClick={() => modifierConsommationCaisseCafe(item)}
                  >
                    Modifier
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => supprimerConsommationCaisseCafe(item.id)}
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

  if (page === "vieGroupe") {
    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Vie de groupe</h2>

        <div className="menu-grid">
          <div className="menu-card" onClick={() => setPage("p4")}>
            📅
            <span>P4</span>
          </div>

          <div className="menu-card" onClick={() => setPage("caisseCafe")}>
            ☕
            <span>Caisse café</span>
          </div>

          <div className="menu-card" onClick={() => setPage("quotidien")}>
            📸
            <span>Quotidien</span>
          </div>

          {Object.entries(VIE_GROUPE_MODULES).map(([key, module]) => (
            <div
              className="menu-card"
              key={key}
              onClick={() => {
                setSelectedVieGroupeModule(key);
                setPage("vieGroupeModule");
              }}
            >
              {module.icon}
              <span>{module.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "vieGroupeModule") {
    const module = VIE_GROUPE_MODULES[selectedVieGroupeModule];

    if (!module) {
      setPage("vieGroupe");
      return null;
    }

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("vieGroupe")}>
          ← Retour
        </button>

        <h2 className="section-title">{module.label}</h2>

        <div className="admin-card">
          <h3>Collègues</h3>
          {colleguesApplication.map((collegue) => (
            <div
              className="user-line"
              key={collegue}
              onClick={() => ouvrirVieGroupeDossier(selectedVieGroupeModule, collegue)}
            >
              <strong>{collegue}</strong>
              <button className="edit-btn">Ouvrir</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "vieGroupeDossier") {
    const module = VIE_GROUPE_MODULES[selectedVieGroupeModule];
    const fields = VIE_GROUPE_DOSSIER_FIELDS[selectedVieGroupeModule] || [];
    const moduleAvecOptions = VIE_GROUPE_OPTION_MODULES.includes(selectedVieGroupeModule);
    const optionsModule = getOptionsVieGroupeModule(selectedVieGroupeModule);
    const champsMasquesParOptions = ["materiel", "habilitations", "stages", "arme", "dates"];
    const champsFormulaire = moduleAvecOptions
      ? fields.filter(([field]) => !champsMasquesParOptions.includes(field))
      : fields;
    const dossiers = vieGroupeDossiers.filter(
      (item) =>
        item.type === module?.tableType &&
        item.collegue === selectedVieGroupeCollegue
    );
    const peutAjouterDossier =
      peutGererVieGroupeDossiers ||
      selectedVieGroupeCollegue === collegueP4Utilisateur;

    if (!module) {
      setPage("vieGroupe");
      return null;
    }

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("vieGroupeModule")}>
          ← Retour
        </button>

        <h2 className="section-title">
          {module.label} - {selectedVieGroupeCollegue}
        </h2>

        {moduleAvecOptions && peutGererVieGroupeDossiers && (
          <div className="admin-card">
            <h3>Gérer les choix {VIE_GROUPE_OPTION_LABELS[selectedVieGroupeModule]}</h3>

            <input
              type="text"
              placeholder={`Nom de l'élément`}
              value={vieGroupeOptionNom}
              onChange={(e) => setVieGroupeOptionNom(e.target.value)}
            />

            <select
              className="role-select"
              value={vieGroupeOptionValiditeType}
              onChange={(e) => setVieGroupeOptionValiditeType(e.target.value)}
            >
              <option value="aucune">Aucune validité</option>
              <option value="date">Date fixe</option>
              <option value="delai">Délai automatique</option>
            </select>

            {vieGroupeOptionValiditeType === "date" && (
              <div className="date-field">
                <span>Date de validité</span>
                <input
                  type="date"
                  value={vieGroupeOptionValiditeDate}
                  onChange={(e) => setVieGroupeOptionValiditeDate(e.target.value)}
                />
              </div>
            )}

            {vieGroupeOptionValiditeType === "delai" && (
              <div className="form-row">
                <input
                  type="number"
                  min="1"
                  placeholder="Durée"
                  value={vieGroupeOptionValiditeDelaiNombre}
                  onChange={(e) => setVieGroupeOptionValiditeDelaiNombre(e.target.value)}
                />
                <select
                  className="role-select"
                  value={vieGroupeOptionValiditeDelaiUnite}
                  onChange={(e) => setVieGroupeOptionValiditeDelaiUnite(e.target.value)}
                >
                  <option value="jours">Jour(s)</option>
                  <option value="mois">Mois</option>
                  <option value="ans">An(s)</option>
                </select>
              </div>
            )}

            <button className="admin-main-btn" onClick={enregistrerVieGroupeOption}>
              {editingVieGroupeOptionId ? "Modifier le choix" : "Ajouter le choix"}
            </button>

            {editingVieGroupeOptionId && (
              <button className="cancel-btn" onClick={resetVieGroupeOptionForm}>
                Annuler modification
              </button>
            )}

            {optionsModule.length === 0 && <p>Aucun choix enregistré.</p>}

            {optionsModule.map((option) => (
              <div className="user-line" key={option.id}>
                <div>
                  <strong>{option.nom}</strong>
                  <br />
                  Validité :{" "}
                  {option.validite_type === "date"
                    ? `jusqu'au ${formatDateFr(option.validite_date)}`
                    : option.validite_type === "delai"
                      ? `${option.validite_delai_nombre} ${option.validite_delai_unite}`
                      : "aucune"}
                </div>

                <div className="user-buttons">
                  <button className="edit-btn" onClick={() => modifierVieGroupeOption(option)}>
                    Modifier
                  </button>
                  <button className="delete-btn" onClick={() => supprimerVieGroupeOption(option)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {peutAjouterDossier && (
          <div className="admin-card">
            <h3>{editingVieGroupeDossierId ? "Modifier" : "Ajouter"}</h3>

            {moduleAvecOptions && (
              <>
                <select
                  className="role-select"
                  value={vieGroupeDossierForm.element_id || ""}
                  onChange={(e) => changerVieGroupeDossierForm("element_id", e.target.value)}
                >
                  <option value="">Choisir {VIE_GROUPE_OPTION_LABELS[selectedVieGroupeModule]}</option>
                  {optionsModule.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.nom}
                    </option>
                  ))}
                </select>

                <div className="date-field">
                  <span>Date d'obtention</span>
                  <input
                    type="date"
                    value={vieGroupeDossierForm.date_obtention || ""}
                    onChange={(e) => changerVieGroupeDossierForm("date_obtention", e.target.value)}
                  />
                </div>
              </>
            )}

            {champsFormulaire.map(([field, label]) => (
              field.includes("date") ? (
                <div className="date-field" key={field}>
                  <span>{label}</span>
                  <input
                    type="date"
                    value={vieGroupeDossierForm[field] || ""}
                    onChange={(e) => changerVieGroupeDossierForm(field, e.target.value)}
                  />
                </div>
              ) : (
                <textarea
                  key={field}
                  placeholder={label}
                  value={vieGroupeDossierForm[field] || ""}
                  onChange={(e) => changerVieGroupeDossierForm(field, e.target.value)}
                />
              )
            ))}

            <button className="admin-main-btn" onClick={enregistrerVieGroupeDossier}>
              {editingVieGroupeDossierId ? "Enregistrer modification" : "Ajouter"}
            </button>

            {editingVieGroupeDossierId && (
              <button className="cancel-btn" onClick={resetVieGroupeDossierForm}>
                Annuler modification
              </button>
            )}
          </div>
        )}

        <div className="admin-card">
          <h3>Fiches enregistrées</h3>
          {dossiers.length === 0 && <p>Aucune fiche enregistrée.</p>}

          {dossiers.map((item) => (
            <div
              className={`vie-groupe-note ${getClasseEcheanceVieGroupe(item.data?.echeance)}`}
              key={item.id}
            >
              <div className="vie-groupe-note-meta">
                Ajouté par : {item.created_by || "Inconnu"} - {formatDateFr(item.created_at)}
              </div>

              {item.data?.element_nom && (
                <div className="vie-groupe-dossier-field">
                  <strong>{VIE_GROUPE_OPTION_LABELS[selectedVieGroupeModule]}</strong>
                  <div>{item.data.element_nom}</div>
                </div>
              )}

              {item.data?.date_obtention && (
                <div className="vie-groupe-dossier-field">
                  <strong>Date d'obtention</strong>
                  <div>{formatDateFr(item.data.date_obtention)}</div>
                </div>
              )}

              {item.data?.echeance && (
                <div className="vie-groupe-dossier-field">
                  <strong>Validité</strong>
                  <div>{formatDateFr(item.data.echeance)}</div>
                </div>
              )}

              {fields.map(([field, label]) =>
                item.data?.[field] && !["element_id", "element_nom", "date_obtention", "echeance"].includes(field) ? (
                  <div className="vie-groupe-dossier-field" key={field}>
                    <strong>{label}</strong>
                    <div>{item.data[field]}</div>
                  </div>
                ) : null
              )}

              {peutModifierVieGroupeDossier(item) && (
                <div className="user-buttons">
                  <button className="edit-btn" onClick={() => modifierVieGroupeDossier(item)}>
                    Modifier
                  </button>

                  {peutGererVieGroupeDossiers && (
                    <button className="delete-btn" onClick={() => supprimerVieGroupeDossier(item)}>
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "quotidien") {
    const photosVieGroupe = vieGroupeItems.filter((item) => item.type === "photo");
    const anecdotesVieGroupe = vieGroupeItems.filter((item) => item.type === "texte");

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("vieGroupe")}>
          ← Retour
        </button>

        <h2 className="section-title">Quotidien</h2>

        <div className="sector-switch">
          <button
            className={vieGroupeOnglet === "photos" ? "active-sector" : ""}
            onClick={() => setVieGroupeOnglet("photos")}
          >
            Souvenirs photos
          </button>
          <button
            className={vieGroupeOnglet === "commentaires" ? "active-sector" : ""}
            onClick={() => setVieGroupeOnglet("commentaires")}
          >
            Commentaires
          </button>
        </div>

        {vieGroupeOnglet === "photos" && (
        <div className="admin-card">
          <h3>Souvenirs photos</h3>

          <input
            type="text"
            placeholder="Titre de la photo"
            value={vieGroupePhotoTitre}
            onChange={(e) => setVieGroupePhotoTitre(e.target.value)}
          />

          <div className="vie-groupe-actions">
            <label className="photo-upload-btn">
              Prendre une photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleVieGroupePhoto}
              />
            </label>

            <label className="photo-upload-btn">
              Galerie photo
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleVieGroupePhoto}
              />
            </label>
          </div>

          {photosVieGroupe.length === 0 && <p>Aucune photo souvenir.</p>}

          <div className="vie-groupe-grid">
            {photosVieGroupe.map((item) => (
              <div className="vie-groupe-photo-card" key={item.id}>
                <img
                  src={item.photo_url}
                  alt="souvenir"
                  onClick={() => setPhotoZoom(item.photo_url)}
                />
                {getVieGroupeTitre(item) && (
                  <div className="vie-groupe-photo-title">{getVieGroupeTitre(item)}</div>
                )}
                <div className="vie-groupe-meta">
                  Ajouté par : {item.redacteur || item.created_by || "Inconnu"}
                  <br />
                  Le : {formatDateFr(item.created_at)} à {formatHeureFr(item.created_at)}
                </div>

                {editingVieGroupePhotoId === item.id && (
                  <>
                    <button className="admin-main-btn" onClick={enregistrerTitreVieGroupePhoto}>
                      Enregistrer titre
                    </button>
                    <button className="cancel-btn" onClick={resetVieGroupePhotoForm}>
                      Annuler
                    </button>
                  </>
                )}

                <div className="user-buttons">
                  {peutModifierVieGroupeItem(item) && (
                    <button className="edit-btn" onClick={() => modifierVieGroupePhoto(item)}>
                      Modifier titre
                    </button>
                  )}

                  {peutGererVieGroupe && (
                    <button className="delete-btn" onClick={() => supprimerVieGroupeItem(item)}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {vieGroupeOnglet === "commentaires" && (
        <div className="admin-card">
          <h3>Commentaires</h3>

          <textarea
            placeholder="Anecdote, souvenir, message..."
            value={vieGroupeTexte}
            onChange={(e) => setVieGroupeTexte(e.target.value)}
          />

          <button className="admin-main-btn" onClick={enregistrerAnecdoteVieGroupe}>
            {editingVieGroupeId ? "Enregistrer modification" : "Ajouter l'anecdote"}
          </button>

          {editingVieGroupeId && (
            <button className="cancel-btn" onClick={resetVieGroupeForm}>
              Annuler modification
            </button>
          )}

          {anecdotesVieGroupe.length === 0 && <p>Aucune anecdote enregistrée.</p>}

          {anecdotesVieGroupe.map((item) => (
            <div className="vie-groupe-note" key={item.id}>
              <div>
                <div className="vie-groupe-note-meta">
                  <strong>{item.redacteur || item.created_by || "Inconnu"}</strong>
                  <br />
                  {formatDateFr(item.created_at)} à {formatHeureFr(item.created_at)}
                </div>
                <div className="vie-groupe-commentaire">{item.contenu}</div>
              </div>

              <div className="user-buttons">
                {peutModifierVieGroupeItem(item) && (
                  <button className="edit-btn" onClick={() => modifierVieGroupeItem(item)}>
                    Modifier
                  </button>
                )}

                {peutGererVieGroupe && (
                  <button className="delete-btn" onClick={() => supprimerVieGroupeItem(item)}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  }

  if (page === "favorisBac") {
    const identitesFavorites = trierIdentitesParNom(
      identites.filter((person) => person.favori_bac)
    );
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

  const peutVoirAlertesAccueil =
    currentUser?.role === "LE TÔLIER" ||
    currentUser?.role === "ADMINISTRATEUR";
  const notificationsATraiter = p4Conges
    .filter((item) =>
      (getP4Nature(item) === "demande" && item.statut === "demande") ||
      (getP4Nature(item) === "previsionnel" && item.statut === "previsionnel")
    )
    .map((item) => ({
      key: `p4-${item.id}`,
      type: "p4",
      titre:
        getP4Nature(item) === "previsionnel"
          ? "Prévisionnel P4 à contrôler"
          : "Demande de congé P4 à valider",
      item,
    }))
    .filter((notification) => !notificationsMasquees.includes(notification.key));

  if (page === "aTraiter" && peutVoirAlertesAccueil) {
    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">À traiter</h2>

        <div className="results-list">
          {notificationsATraiter.length === 0 && (
            <div className="admin-card">Aucune notification importante.</div>
          )}

          {notificationsATraiter.map((notification) => {
            const item = notification.item;

            return (
              <div className="person-card" key={notification.key}>
                <div className="avatar">⚠️</div>

                <div className="person-info">
                  <div className="person-name">{notification.titre}</div>
                  <div>Collègue : {getP4CollegueLabel(item.collegue)}</div>
                  <div>Type : {getP4TypeCourt(item.type)}</div>
                  <div>
                    Période : {formatDateFr(item.date_debut)} au{" "}
                    {formatDateFr(item.date_fin || item.date_debut)}
                  </div>
                  <div>Nature : {getP4NatureLabel(item)}</div>
                  <div>Demandé le : {formatDateFr(item.created_at)} à {formatHeureFr(item.created_at)}</div>
                  {item.commentaire && <div>Commentaire : {item.commentaire}</div>}

                  <div className="person-actions">
                    <button
                      className="edit-btn"
                      onClick={() => changerStatutP4Conge(item, "valide")}
                    >
                      Valider
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => supprimerNotification(notification)}
                    >
                      Supprimer notification
                    </button>

                    <button className="cancel-btn" onClick={() => setPage("p4")}>
                      Ouvrir P4
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

      {peutVoirAlertesAccueil && (
        <button
          className={`home-wide-action home-alerts ${notificationsATraiter.length === 0 ? "empty" : ""}`}
          onClick={() => setPage("aTraiter")}
        >
          <span>À traiter</span>
          <strong>
            {notificationsATraiter.length === 0
              ? "Aucune alerte importante"
              : `${notificationsATraiter.length} élément(s)`}
          </strong>
        </button>
      )}

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

        <div className="menu-card" onClick={() => setPage("interpellations")}>
          🚓
          <span>Interpellations</span>
        </div>

        <div className="menu-card" onClick={() => setPage("vieGroupe")}>
          📸
          <span>Vie de groupe</span>
        </div>

      </div>

      {peutVoirAlertesAccueil && (
        <button className="home-wide-action admin-home-action" onClick={() => setPage("admin")}>
          <span>Administration</span>
          <strong>Gestion utilisateurs, historique et droits</strong>
        </button>
      )}

      <PhotoZoomOverlay
        photoZoom={photoZoom}
        onClose={() => setPhotoZoom("")}
      />
    </div>
  );
}

export default App;
