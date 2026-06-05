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

function getPhotos(person) {
  if (Array.isArray(person.photos)) return person.photos;
  if (person.photo) return [person.photo];
  return [];
}

function getPhotoPrincipale(person) {
  const photos = getPhotos(person);
  const index = person.photoPrincipaleIndex || 0;
  return photos[index] || photos[0] || "";
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

  const [nouvelleIdentiteNom, setNouvelleIdentiteNom] = useState("");
  const [nouvelleIdentitePrenom, setNouvelleIdentitePrenom] = useState("");
  const [nouvelleIdentiteAlias, setNouvelleIdentiteAlias] = useState("");
  const [nouvelleIdentiteNaissance, setNouvelleIdentiteNaissance] = useState("");
  const [nouvelleIdentiteSecteur, setNouvelleIdentiteSecteur] = useState("");
  const [nouvelleIdentiteFaits, setNouvelleIdentiteFaits] = useState("");
  const [nouvelleIdentiteObservations, setNouvelleIdentiteObservations] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeSecteur, setTypeSecteur] = useState("habituel");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [alias, setAlias] = useState("");
  const [naissance, setNaissance] = useState("");
  const [secteur, setSecteur] = useState("");
  const [faits, setFaits] = useState("");
  const [vehicule, setVehicule] = useState("");
  const [observations, setObservations] = useState("");
  const [photo, setPhoto] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPrincipaleIndex, setPhotoPrincipaleIndex] = useState(0);
    useEffect(() => {
  chargerIdentites();
  chargerVehicules();

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

  return () => {
    supabase.removeChannel(identitesChannel);
    supabase.removeChannel(vehiculesChannel);
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
  }));

  setVehicules(vehiculesFormates);
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

  const ajouterHistorique = (action) => {
    const now = new Date();

    const entree = {
      id: Date.now(),
      action,
      utilisateur: currentUser?.username || "Inconnu",
      date: now.toLocaleDateString(),
      heure: now.toLocaleTimeString(),
    };

    const updated = [entree, ...historique];
    setHistorique(updated);
    localStorage.setItem("historique", JSON.stringify(updated));
  };

  const viderHistorique = () => {
    if (currentUser?.role !== "LE TÔLIER") {
      alert("Seul le Tôlier peut vider l'historique.");
      return;
    }

    const confirmation = confirm(
      "Confirmer la suppression complète de l'historique ?"
    );

    if (!confirmation) return;

    setHistorique([]);
    localStorage.setItem("historique", JSON.stringify([]));
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
      : `${username}@oeildesauron.com`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Identifiant ou mot de passe incorrect.");
    return;
  }

  const { data: profil, error: profilError } = await supabase
    .from("users")
    .select("*")
    .eq("username", loginClean)
    .single();

  if (profilError) {
    console.log("ERREUR PROFIL :", profilError);
    alert("Connexion réussie, mais profil utilisateur introuvable.");
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

  const fiche = {
    nom,
    prenom,
    alias,
    naissance,
    secteur,
    faits,
    vehicule: "",
    observations,
    photo: photos[photoPrincipaleIndex] || photo || "",
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

  ajouterHistorique(
    editingId
      ? `Modification identité : ${nom} ${prenom}`
      : `Création identité : ${nom} ${prenom}`
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
    setSecteur(person.secteur || "");
    setFaits(person.faits || "");
    setVehicule("");
    setObservations(person.observations || "");

    const loadedPhotos = getPhotos(person);
    const loadedIndex = person.photoPrincipaleIndex || 0;

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

  const { error } = await supabase
    .from("identites")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur suppression identité : " + error.message);
    return;
  }

  ajouterHistorique("Suppression identité");
};


  const resetNouvelleIdentiteDepuisVehicule = () => {
    setNouvelleIdentiteNom("");
    setNouvelleIdentitePrenom("");
    setNouvelleIdentiteAlias("");
    setNouvelleIdentiteNaissance("");
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
      alert("Erreur lors de la création de l'identité liée.");
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

  ajouterHistorique(
    editingVehiculeId
      ? `Modification véhicule : ${vehiculeMarque} ${vehiculeModele}`
      : `Création véhicule : ${vehiculeMarque} ${vehiculeModele}`
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
    setVehiculeIndividuId(item.individuId || "");
    setPage("addVehicule");
  };

  const supprimerVehicule = async (id) => {
  const { error } = await supabase
    .from("vehicules")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur suppression véhicule : " + error.message);
    return;
  }

  ajouterHistorique("Suppression véhicule");
};
  const handlePhoto = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const nouvellePhoto = reader.result;

        setPhotos((anciennesPhotos) => {
          const updatedPhotos = [...anciennesPhotos, nouvellePhoto];

          if (anciennesPhotos.length === 0) {
            setPhotoPrincipaleIndex(0);
            setPhoto(nouvellePhoto);
          }

          return updatedPhotos;
        });
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const definirPhotoPrincipale = (index) => {
    setPhotoPrincipaleIndex(index);
    setPhoto(photos[index] || "");
  };

  const supprimerPhoto = (index) => {
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

  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: newUsername,
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
    console.log("ERREUR API CREATE USER :", result);
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
              <div className="avatar">🚗</div>

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
                  <div className="person-alias">
                    Identité liée : {getNomIdentite(identites, item.individuId)}
                  </div>
                )}

                <div className="person-actions">
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
            <div className="person-card" key={person.id}>
              <div className="avatar">
                {getPhotoPrincipale(person) ? (
                  <img
                    src={getPhotoPrincipale(person)}
                    alt="photo"
                    className="person-photo"
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
                    onClick={() => modifierIdentite(person)}
                  >
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
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === "secteurs") {
    const secteurs =
      typeSecteur === "habituel"
        ? identites.map((person) => person.secteur).filter(Boolean)
        : identites.map((person) => person.faits).filter(Boolean);

    const secteursUniques = [...new Set(secteurs)];

    return (
      <div className="home-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Retour
        </button>

        <h2 className="section-title">Secteurs</h2>

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
              Aucun secteur enregistré.
            </div>
          )}

          {secteursUniques.map((secteurNom) => {
            const personnes = identites.filter((person) =>
              typeSecteur === "habituel"
                ? person.secteur === secteurNom
                : person.faits === secteurNom
            );

            return (
              <div className="person-card" key={secteurNom}>
                <div className="avatar">📍</div>

                <div className="person-info">
                  <div className="person-name">{secteurNom}</div>
                  <div>Individus liés : {personnes.length}</div>

                  {personnes.map((person) => (
                    <div key={person.id} className="person-alias">
                      {person.nom} {person.prenom}
                      {person.alias ? ` — ${person.alias}` : ""}
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
            <div className="person-card" key={item.id}>
              <div className="avatar">🚗</div>

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
                  <div className="person-alias">
                    Identité liée : {getNomIdentite(identites, item.individuId)}
                  </div>
                )}

                <div className="person-actions">
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
        </div>
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
            <div className="person-card" key={person.id}>
              <div className="avatar">
                {getPhotoPrincipale(person) ? (
                  <img
                    src={getPhotoPrincipale(person)}
                    alt="photo"
                    className="person-photo"
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
                    onClick={() => modifierIdentite(person)}
                  >
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
              </div>
            </div>
          ))}
        </div>
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
              <div className="main-photo-box">
                <img
                  src={photos[photoPrincipaleIndex] || photos[0]}
                  alt="photo principale"
                  className="photo-preview"
                />
                <div className="person-alias">Photo principale</div>
              </div>

              <div className="photos-grid">
                {photos.map((item, index) => (
                  <div className="photo-item" key={index}>
                    <img
                      src={item}
                      alt={`photo ${index + 1}`}
                      className="person-photo"
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
                <div>Utilisateur : {item.utilisateur}</div>
                <div>Date : {item.date}</div>
                <div>Heure : {item.heure}</div>
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
    </div>
  );
}

export default App;
