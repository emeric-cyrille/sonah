export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            SONAH
          </h1>
          <p className="text-2xl text-gray-700 mb-2">
            Système d'Orientation Nationale et d'Accompagnement Harmonisé
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
            Intelligence Artificielle Multi-Agents pour l'Administration Camerounaise
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">-77%</div>
            <div className="text-gray-600">Délai création entreprise</div>
            <div className="text-sm text-gray-500 mt-2">90 jours → 21 jours</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">-70%</div>
            <div className="text-gray-600">Taux d'abandon</div>
            <div className="text-sm text-gray-500 mt-2">60% → 18%</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">-100%</div>
            <div className="text-gray-600">Coût facilitateurs</div>
            <div className="text-sm text-gray-500 mt-2">45,000 FCFA → 0 FCFA</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              GPS Administratif
            </h3>
            <p className="text-gray-600">
              Guidage pas-à-pas dans toutes les démarches administratives avec coordination intelligente de 15+ agents IA spécialisés.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Professeur de Droits
            </h3>
            <p className="text-gray-600">
              Explication des droits constitutionnels, détection automatique des violations et génération de recours légaux.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Veilleur 24/7
            </h3>
            <p className="text-gray-600">
              Scraping automatique de 20+ sites gouvernementaux pour détecter nouvelles lois, opportunités et changements réglementaires.
            </p>
          </div>
        </div>

        {/* Architecture */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Architecture Technique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Frontend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Next.js 14 (App Router)</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Socket.io (temps réel)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Backend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• NestJS API Gateway</li>
                <li>• LangGraph (orchestration multi-agents)</li>
                <li>• GPT-4o + Mistral 7B</li>
                <li>• Prisma ORM</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Bases de Données</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PostgreSQL + pgvector (Vector DB)</li>
                <li>• Neo4j (Graph DB)</li>
                <li>• Redis (Cache)</li>
                <li>• RabbitMQ (Message Queue)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Infrastructure</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Docker & Docker Compose</li>
                <li>• Traefik (Reverse Proxy)</li>
                <li>• GitHub Actions (CI/CD)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors">
            Commencer
          </button>
          <p className="text-sm text-gray-500 mt-4">
            WhatsApp • Application Web • USSD
          </p>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full">
            <span className="font-semibold">Phase 1.1</span> - Infrastructure Setup Complete
          </div>
        </div>
      </div>
    </main>
  );
}
