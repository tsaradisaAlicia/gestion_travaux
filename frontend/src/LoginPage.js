import React, { useState } from 'react';
// Importez les nouvelles icônes nécessaires
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import logoThermocool from './assets/logo_thermocool.png';
import fondBackground from './assets/fond_gestion_travaux.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const [matricule, setMatricule] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ Nouvel état pour la visibilité
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (matricule.trim() === '' || motDePasse.trim() === '') {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        matricule,
        motDePasse,
      });

      console.log('Réponse de connexion:', response.data);

      if (response.data.message === 'Connexion réussie') {
        setErreur('');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.roleName);
        localStorage.setItem('userMatricule', response.data.user.matricule);
        localStorage.setItem('userName', response.data.user.nom + ' ' + response.data.user.prenoms);
        navigate('/accueil');
      } else {
        setErreur(response.data.message || 'Erreur de connexion inattendue.');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error.response ? error.response.data : error.message);
      if (error.response && error.response.status === 401) {
        setErreur('Matricule ou mot de passe incorrect.');
      } else {
        setErreur('Une erreur est survenue. Veuillez réessayer plus tard.');
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${fondBackground})`,
      }}
    >
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <img src={logoThermocool} alt="Logo Thermocool" className="mx-auto mb-6 h-20" />
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Connexion</h2>

        {erreur && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{erreur}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4 text-left">
            <label className="block text-gray-700 mb-1" htmlFor="matricule">
              Matricule
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="matricule"
                type="text"
                className="w-full pl-10 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-6 text-left">
            <label className="block text-gray-700 mb-1" htmlFor="motDePasse">
              Mot de passe
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="motDePasse"
                // ✅ Utilisez showPassword pour définir le type de l'input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-10 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
              />
              {/* ✅ Ajoutez le bouton pour basculer la visibilité */}
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Cacher le mot de passe' : 'Montrer le mot de passe'}
              >
                {/* ✅ Affichez l'icône correcte en fonction de l'état */}
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;