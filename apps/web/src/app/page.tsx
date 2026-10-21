export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            🇨🇲 SONAH
          </h1>
          <p className="text-2xl text-gray-700 mb-2">
            Système d'Orientation Nationale
          </p>
          <p className="text-2xl text-gray-700 mb-6">
            et d'Accompagnement Harmonisé
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Intelligence Artificielle Multi-Agents pour l'Administration Camerounaise
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">-77%</div>
            <div className="text-gray-600">Délai création entreprise</div>
            <div className="text-sm text-gray-500 mt-2">90j → 21j</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">-70%</div>
            <div className="text-gray-600">Taux d'abandon</div>
            <div className="text-sm text-gray-500 mt-2">60% → 18%</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">-100%</div>
            <div className="text-gray-600">Coût facilitateurs</div>
            <div className="text-sm text-gray-500 mt-2">45k FCFA → 0 FCFA</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🧭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              GPS Administratif
            </h3>
            <p className="text-gray-600">
              Guide pas-à-pas dans toutes vos démarches administratives avec coordination intelligente de 15+ agents IA.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">⚖️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Professeur de Droits
            </h3>
            <p className="text-gray-600">
              Explique vos droits constitutionnels, détecte les violations et génère des recours automatiquement.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Veilleur 24/7
            </h3>
            <p className="text-gray-600">
              Scraping automatique de 20+ sites gouvernementaux pour détecter nouvelles lois et opportunités.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors">
            Commencer Maintenant
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Accessible via WhatsApp • Web • USSD
          </p>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full">
            <span className="font-semibold">🚀 Phase 1.1</span> - Infrastructure Setup Complete
          </div>
        </div>
      </div>
    </main>
  );
}
