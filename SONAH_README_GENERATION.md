# SONAH - Instructions de Génération des Documents Finaux

## 📋 Résumé des Livrables

Vous avez maintenant **3 documents professionnels** pour le projet SONAH :

1. ✅ **SONAH_Presentation_Professionnelle.md** (35 pages)
   - Document de présentation technique complet
   - Destiné au hackathon ITU AI for Good Sandbox 2026
   - Contient : problème, solution, architecture, impact, roadmap

2. ✅ **SONAH_Guide_Utilisateur.md** (40 pages)
   - Guide utilisateur complet
   - Similaire en qualité au guide TravelLab
   - Contient : tutoriels, cas d'usage, FAQ, dépannage

3. ✅ **SONAH_Maquettes_Description.md** (15 pages)
   - Spécifications détaillées pour générer les maquettes visuelles
   - 4 maquettes WhatsApp + 3 maquettes Web + 2 schémas architecture
   - Instructions pixel-perfect avec code couleur, dimensions, etc.

---

## 🎨 Prochaines Étapes : Génération des Visuels

### Option 1 : Génération Automatique avec IA (Recommandé)

Utilisez un outil de génération d'images IA pour créer les maquettes :

#### DALL-E 3 (OpenAI)

**Accès :** ChatGPT Plus ou API OpenAI

**Prompts à utiliser :** Voir le fichier `SONAH_Maquettes_Description.md`, section "4. Guide de Génération avec IA"

**Exemple pour Maquette WhatsApp 1 :**

```
Generate a professional WhatsApp mobile chat mockup showing a conversation
between a user and a bot named SONAH. The interface should have:

- iPhone X screen resolution (375x812px)
- WhatsApp standard UI: green header (#075E54) with "SONAH" title,
  beige background (#E5DDD5)
- Bot messages in white bubbles on the left
- User messages in light green bubbles (#DCF8C6) on the right
- First bot message shows a menu with emojis: 1️⃣ Créer entreprise,
  2️⃣ Documents identité, etc.
- User asks: "Je veux ouvrir un restaurant à Yaoundé"
- Bot responds with detailed breakdown of 3 steps (MINCOMMERCE, MINSANTÉ,
  Mairie) with durations and costs
- Professional, clean design, realistic WhatsApp styling
- French language
- Modern, accessible UI
```

**Avantages :**
- Rapide (2-3 minutes par image)
- Qualité professionnelle
- Pas besoin de compétences en design

---

#### Midjourney

**Accès :** Discord Midjourney

**Prompts similaires :** Adaptez les prompts DALL-E ci-dessus

**Commande Midjourney :**
```
/imagine prompt: [votre prompt] --ar 9:16 --v 6 --style raw --q 2
```

**Paramètres :**
- `--ar 9:16` : ratio mobile vertical
- `--v 6` : version 6 (meilleure qualité)
- `--style raw` : style photographique
- `--q 2` : haute qualité

---

### Option 2 : Design Manuel (Plus de Contrôle)

Si vous préférez un contrôle total sur le design :

#### Figma (Recommandé pour le Web)

**Étapes :**

1. **Créer un nouveau projet Figma**
   - Ouvrez https://figma.com
   - Nouveau fichier : "SONAH Maquettes"

2. **Importer les spécifications**
   - Créez des frames :
     - Mobile : 375 × 812 px (WhatsApp)
     - Desktop : 1920 × 1080 px (Web App)

3. **Palette de couleurs** (à créer comme styles)
   ```
   Bleu primaire : #1E40AF
   Vert secondaire : #059669
   Orange accents : #F59E0B
   Gris backgrounds : #F9FAFB, #E5E7EB
   Texte : #111827

   WhatsApp :
   Header : #075E54
   Background : #E5DDD5
   Bulles bot : #FFFFFF
   Bulles user : #DCF8C6
   ```

4. **Polices**
   - Mobile : System font (SF Pro / Roboto)
   - Web : Inter ou Roboto

5. **Composants réutilisables**
   - Créez des composants pour :
     - Bulles WhatsApp
     - Cartes métriques (Web)
     - Boutons
     - Barres de progression

6. **Export**
   - Format : PNG 2x (haute résolution)
   - Ou PDF si nécessaire

**Ressources Figma utiles :**
- WhatsApp UI Kit : cherchez "WhatsApp UI Kit" dans Figma Community
- Icônes : Heroicons, Lucide Icons (plugins Figma)

---

#### Canva (Alternative Facile)

**Étapes :**

1. **Créer un design personnalisé**
   - Dimensions : 375 × 812 px (mobile) ou 1920 × 1080 px (web)

2. **Utiliser les templates**
   - Cherchez "Mobile Chat UI" ou "Dashboard"
   - Adaptez les couleurs SONAH

3. **Ajouter du texte**
   - Copiez-collez les textes depuis `SONAH_Maquettes_Description.md`

4. **Export**
   - PNG haute qualité

**Avantages :**
- Très facile à utiliser
- Templates prêts à l'emploi
- Gratuit (version de base)

---

#### Photoshop / Illustrator (Professionnel)

Si vous maîtrisez Adobe :

1. **Créer un nouveau document**
   - Résolution : 300 DPI
   - Dimensions : voir `SONAH_Maquettes_Description.md`

2. **Utiliser les mockups**
   - Téléchargez des mockups iPhone/Desktop gratuits
   - Sites : Freepik, MockupWorld, Behance

3. **Insérer vos designs**
   - Smart objects pour faciliter les modifications

---

### Option 3 : Mix (IA + Retouche Manuelle)

**Recommandation :**

1. **Générer avec DALL-E/Midjourney** (base)
2. **Retoucher avec Figma/Photoshop** (finitions)

**Avantages :**
- Rapidité de l'IA
- Contrôle des détails manuels
- Meilleur compromis qualité/temps

---

## 📄 Conversion Markdown → PDF Professionnel

### Option 1 : Pandoc + LaTeX (Meilleure Qualité)

**Installation :**

```bash
# macOS
brew install pandoc
brew install --cask basictex

# Ubuntu/Debian
sudo apt install pandoc texlive-xetex
```

**Commande de conversion :**

```bash
# Document de présentation
pandoc SONAH_Presentation_Professionnelle.md \
  -o SONAH_Presentation_Professionnelle.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=2 \
  --number-sections \
  -V geometry:margin=2.5cm \
  -V fontsize=11pt \
  -V documentclass=report \
  -V mainfont="Arial" \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V urlcolor=blue

# Guide utilisateur
pandoc SONAH_Guide_Utilisateur.md \
  -o SONAH_Guide_Utilisateur.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=3 \
  --number-sections \
  -V geometry:margin=2.5cm \
  -V fontsize=11pt \
  -V documentclass=report \
  -V mainfont="Arial" \
  -V colorlinks=true \
  -V linkcolor=blue
```

**Personnalisation avancée :**

Créez un fichier `template.latex` pour un contrôle total (marges, en-têtes, pieds de page, etc.)

---

### Option 2 : Typora (Simple et Rapide)

**Installation :**
- Téléchargez Typora : https://typora.io
- Prix : ~15 USD (essai gratuit 15 jours)

**Étapes :**

1. Ouvrez le fichier `.md` dans Typora
2. Menu : File → Export → PDF
3. Choisissez le thème (GitHub, Academic, etc.)
4. Export

**Avantages :**
- Interface WYSIWYG (What You See Is What You Get)
- Très simple
- Aperçu en temps réel

---

### Option 3 : VS Code + Markdown PDF Extension

**Installation :**

1. Ouvrez VS Code
2. Extensions → Cherchez "Markdown PDF"
3. Installez l'extension de yzane

**Utilisation :**

1. Ouvrez le fichier `.md`
2. Clic droit → "Markdown PDF: Export (pdf)"
3. Le PDF est généré dans le même dossier

**Avantages :**
- Gratuit
- Intégré à VS Code
- Rapide

---

### Option 4 : Services en Ligne

#### Dillinger.io (Gratuit)

1. Visitez https://dillinger.io
2. Copiez-collez le contenu Markdown
3. Menu : Export as → PDF

#### Markdown to PDF (Gratuit)

1. Visitez https://www.markdowntopdf.com
2. Upload le fichier `.md`
3. Download PDF

**Avantages :**
- Aucune installation
- Gratuit
- Rapide

**Inconvénient :**
- Moins de contrôle sur le style

---

## 🖼️ Insertion des Maquettes dans les Documents

### Méthode 1 : Markdown Natif

Si vous générez les maquettes en PNG, ajoutez-les ainsi :

```markdown
### Maquette WhatsApp 1 : Création Restaurant

![Maquette WhatsApp - Création Restaurant](./images/whatsapp_creation_restaurant.png)

*Figure 1 : Conversation WhatsApp pour la création d'un restaurant*
```

**Structure de dossiers recommandée :**

```
/Desktop/
├── SONAH_Presentation_Professionnelle.md
├── SONAH_Guide_Utilisateur.md
├── SONAH_Maquettes_Description.md
└── images/
    ├── whatsapp_menu.png
    ├── whatsapp_creation_restaurant.png
    ├── whatsapp_violation_salaire.png
    ├── whatsapp_alerte_loi.png
    ├── whatsapp_generation_pdf.png
    ├── web_dashboard.png
    ├── web_orchestration.png
    ├── web_professeur_droits.png
    ├── schema_architecture_globale.png
    └── schema_flux_traitement.png
```

---

### Méthode 2 : Assemblage Final avec LaTeX

Si vous voulez un contrôle total, créez un document LaTeX qui :
- Importe les sections Markdown (via Pandoc)
- Insère les images PNG aux bons endroits
- Gère la mise en page professionnelle

---

## 📊 Génération des Schémas d'Architecture

### Option 1 : Mermaid.js (Code → Diagramme)

**Outils en ligne :**
- Mermaid Live Editor : https://mermaid.live

**Code fourni :** Voir `SONAH_Maquettes_Description.md`, section "Schéma 1"

**Étapes :**

1. Copiez le code Mermaid
2. Collez dans Mermaid Live Editor
3. Ajustez les couleurs/styles
4. Export PNG/SVG

**Avantages :**
- Génération automatique
- Facile à modifier
- Versionnable (code)

---

### Option 2 : Draw.io (Visuel)

**Accès :** https://app.diagrams.net (gratuit)

**Étapes :**

1. Nouveau diagramme
2. Utilisez les formes :
   - Rectangles pour les composants
   - Flèches pour les connexions
   - Groupes pour les couches

3. **Palette de couleurs :**
   ```
   Interfaces : #1E40AF (bleu)
   Backend : #059669 (vert)
   IA/ML : #F59E0B (orange)
   Infrastructure : #6B7280 (gris)
   ```

4. Export PNG haute résolution (300 DPI)

**Avantages :**
- Contrôle total
- Gratuit
- Cloud (accessible partout)

---

### Option 3 : Lucidchart (Professionnel)

**Accès :** https://lucidchart.com (essai gratuit)

**Similar à Draw.io mais avec :**
- Templates professionnels
- Collaboration en temps réel
- Export haute qualité

---

## 📦 Livraison Finale

### Structure Recommandée

```
SONAH_Documents_Finaux/
│
├── 01_Presentation/
│   ├── SONAH_Presentation_Professionnelle.pdf
│   └── sources/
│       └── SONAH_Presentation_Professionnelle.md
│
├── 02_Guide_Utilisateur/
│   ├── SONAH_Guide_Utilisateur.pdf
│   └── sources/
│       └── SONAH_Guide_Utilisateur.md
│
├── 03_Maquettes/
│   ├── WhatsApp/
│   │   ├── 01_menu_principal.png
│   │   ├── 02_creation_restaurant.png
│   │   ├── 03_violation_salaire.png
│   │   ├── 04_alerte_nouvelle_loi.png
│   │   └── 05_generation_pdf.png
│   │
│   ├── Web_App/
│   │   ├── 01_dashboard_principal.png
│   │   ├── 02_orchestration_agents.png
│   │   └── 03_professeur_droits.png
│   │
│   └── Architecture/
│       ├── schema_architecture_globale.png
│       └── schema_flux_traitement.png
│
├── 04_Specifications/
│   └── SONAH_Maquettes_Description.pdf
│
└── README.md (ce fichier)
```

---

## 🎯 Checklist Finale

### Documents PDF

- [ ] SONAH_Presentation_Professionnelle.pdf (25-35 pages)
  - [ ] Table des matières
  - [ ] Numérotation des sections
  - [ ] Liens cliquables
  - [ ] Qualité d'impression professionnelle

- [ ] SONAH_Guide_Utilisateur.pdf (35-45 pages)
  - [ ] Table des matières
  - [ ] Numérotation des sections
  - [ ] Liens cliquables
  - [ ] Captures d'écran insérées

---

### Maquettes Visuelles

- [ ] 4 maquettes WhatsApp (PNG 375×812, 300 DPI)
  - [ ] Menu principal
  - [ ] Création restaurant
  - [ ] Violation salaire
  - [ ] Alerte nouvelle loi
  - [ ] Génération PDF

- [ ] 3 maquettes Web App (PNG 1920×1080, 300 DPI)
  - [ ] Dashboard principal
  - [ ] Orchestration multi-agents
  - [ ] Professeur de droits

- [ ] 2 schémas architecture (PNG/SVG haute résolution)
  - [ ] Architecture globale
  - [ ] Flux de traitement

---

### Qualité

- [ ] Toutes les images en haute résolution (300 DPI minimum)
- [ ] Palette de couleurs cohérente (bleu #1E40AF, vert #059669, orange #F59E0B)
- [ ] Polices professionnelles (Arial, Roboto, Inter)
- [ ] Pas de fautes d'orthographe
- [ ] Liens et références vérifiés
- [ ] Cohérence entre les documents (mêmes chiffres, mêmes exemples)

---

## 💡 Conseils Finaux

### Pour le Hackathon

1. **Imprimez quelques pages** (en couleur) pour montrer la qualité
2. **Préparez une démo live** (si possible) avec les maquettes
3. **Créez une présentation PowerPoint** (10-15 slides) résumant les points clés
4. **Pitch de 3 minutes** :
   - Problème (1 min) : 60% d'abandon, 90 jours, 800 Md FCFA perdus
   - Solution (1 min) : SONAH, 3 interfaces, 15 agents IA, triple RAG
   - Impact (1 min) : 2,5M citoyens, 420 Md FCFA PIB, ROI 1:985

### Pour la Conversion PDF

Si vous voulez la **meilleure qualité** :
1. Utilisez **Pandoc + XeLaTeX** (Option 1)
2. Créez un template LaTeX personnalisé
3. Ajustez les marges, en-têtes, pieds de page

Si vous voulez la **plus grande rapidité** :
1. Utilisez **Typora** (Option 2)
2. Thème "Academic" ou "GitHub"
3. Export direct PDF

### Pour les Maquettes

Si vous voulez **gagner du temps** :
1. Utilisez **DALL-E 3** avec les prompts fournis
2. Retouchez légèrement avec Figma si nécessaire
3. Export PNG 2x

Si vous voulez le **maximum de contrôle** :
1. Figma pour tout créer manuellement
2. Utilisez des UI Kits WhatsApp existants
3. Créez des composants réutilisables

---

## 🚀 Commandes Rapides

### Génération PDF Rapide (Pandoc)

```bash
# Depuis le dossier Desktop
cd /Users/mac/Desktop

# Présentation
pandoc SONAH_Presentation_Professionnelle.md -o SONAH_Presentation.pdf \
  --pdf-engine=xelatex --toc --number-sections

# Guide Utilisateur
pandoc SONAH_Guide_Utilisateur.md -o SONAH_Guide.pdf \
  --pdf-engine=xelatex --toc --number-sections

# Spécifications Maquettes
pandoc SONAH_Maquettes_Description.md -o SONAH_Maquettes.pdf \
  --pdf-engine=xelatex --toc
```

---

## 📞 Support

Si vous rencontrez des problèmes lors de la génération :

**Email :** fokamemeric@gmail.com

**Problèmes courants :**

1. **Pandoc : "xelatex not found"**
   - Solution : Installez LaTeX (BasicTeX sur macOS, TexLive sur Linux)

2. **Images ne s'affichent pas dans le PDF**
   - Solution : Vérifiez les chemins relatifs (`./images/...`)

3. **Caractères spéciaux mal affichés**
   - Solution : Utilisez XeLaTeX au lieu de PDFLaTeX

---

**Bonne chance pour le hackathon ITU AI for Good Sandbox 2026 ! 🚀**

---

*Ce document a été généré par Claude Code*
*Date : 12 Octobre 2026*
