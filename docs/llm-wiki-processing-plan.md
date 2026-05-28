# LLM Wiki Processing Plan

## 1. Aktueller Stand

Das LLM-Wiki-System existiert bereits als private Next.js-Oberfläche unter `/private/llm-wiki`. Es nutzt `.local-data/llm-wiki` als private Laufzeitdatenbasis und ist durch Admin-Access geschützt.

Es gibt zwei Hauptansichten:

- Ingest-Ansicht zum Sammeln von Text, Dateien und Voice-Captures in einer Inbox.
- Wiki-Ansicht zum Lesen, Suchen, Bearbeiten und Warten der Markdown-Wiki-Struktur.

Die aktuelle Verarbeitung kann pending Inbox-Items bereits in einen Processing-Status verschieben, nach `raw/inbox` kopieren, Source-Pages unter `wiki/sources` erzeugen, `index.md` aktualisieren und Einträge in `log.md` schreiben. Diese Verarbeitung ist aber noch kein bewusst getrennter lokaler Abend-Flow. Sie hängt aktuell an einer Server Action und enthält noch keine echte Audio-Transkription oder AI-Synthese.

Die Architekturentscheidung aus `docs/llm-wiki-architecture.md` bleibt maßgeblich: `.local-data/llm-wiki/wiki` ist die primäre private Wahrheit, Obsidian ist nur optionaler One-Way-Mirror.

## 2. Bestehende Dateien und Funktionen

`app/private/llm-wiki/page.tsx`

- Prüft Admin-Zugriff.
- Rendert entweder die Ingest-Ansicht oder die Wiki-Ansicht.
- Lädt `getInboxSnapshot` und `getWikiSnapshot` serverseitig.

`projects/llm-wiki/LlmWikiIngestWorkspace.tsx`

- Bietet Text-Capture.
- Bietet Datei-Upload in die Inbox.
- Bietet Browser-Mikrofonaufnahme per `MediaRecorder`.
- Speichert Voice-Captures als Datei-Upload mit `kind = voice`.
- Zeigt Inbox-Items mit Status, Typ, Größe, Pfad und Fehlerstatus an.
- Enthält einen Button für `processPendingInboxAction`.

`projects/llm-wiki/LlmWikiWorkspace.tsx`

- Zeigt Wiki-Dateien, Raw-Dateien, Schema, Suche und Graph.
- Bietet manuelles Anlegen und Bearbeiten von Wiki-Seiten.
- Bietet manuelles Hinzufügen von Raw-Sources.
- Enthält ebenfalls eine Voice-Aufnahme, die aktuell direkt über `addRawSourceAction` in `raw`/`wiki/sources` geht und nicht über die Inbox.
- Bietet `runWikiLintAction`.

`projects/llm-wiki/server/actions.ts`

- Enthält Admin-geschützte Server Actions.
- `submitInboxItemAction` erzeugt Text-, File- oder Voice-Inbox-Items.
- `processPendingInboxAction` ruft die vorhandene Pending-Verarbeitung auf.
- `addRawSourceAction` schreibt direkte Raw-Sources und Source-Stubs.
- `createWikiPageAction` und `saveWikiEntryAction` schreiben Wiki-Seiten.
- `runWikiLintAction` erzeugt einen Wiki-Health-Bericht.

`projects/llm-wiki/server/wiki-store.ts`

- Enthält das zentrale Datei- und Datenmodell.
- Initialisiert `.local-data/llm-wiki`.
- Verwaltet Inbox-Metadaten.
- Kopiert pending Items nach `raw/inbox`.
- Erzeugt Source-Pages.
- Aktualisiert Catalog, Index und Log.
- Bietet Suche, Wiki-Graph, Wiki-Lint und path-sichere Reads/Writes.

`docs/llm-wiki-architecture.md`

- Definiert die Architektur: private technische Datenbasis, lokaler Codex-Processing-Flow, Obsidian als One-Way-Mirror, keine automatische Veröffentlichung.

## 3. Datenmodell und Statusmodell

Root:

```text
.local-data/llm-wiki
```

Erwartete Ordner:

```text
.local-data/llm-wiki/inbox/pending
.local-data/llm-wiki/inbox/processing
.local-data/llm-wiki/inbox/processed
.local-data/llm-wiki/inbox/failed
.local-data/llm-wiki/raw
.local-data/llm-wiki/raw/assets
.local-data/llm-wiki/raw/inbox
.local-data/llm-wiki/wiki
.local-data/llm-wiki/wiki/entities
.local-data/llm-wiki/wiki/maintenance
.local-data/llm-wiki/wiki/questions
.local-data/llm-wiki/wiki/sources
.local-data/llm-wiki/wiki/systems
.local-data/llm-wiki/wiki/topics
```

Weitere zentrale Dateien:

```text
.local-data/llm-wiki/schema.md
.local-data/llm-wiki/wiki/index.md
.local-data/llm-wiki/wiki/log.md
```

Inbox-Item-Arten:

- `text`
- `file`
- `voice`

Inbox-Statuswerte:

- `pending`
- `processing`
- `processed`
- `failed`
- `manual-review`

Wichtig: `manual-review` ist ein Statuswert in den Metadaten, aber kein eigener Statusordner. Aktuell bleiben solche Items in `inbox/pending`, werden aber als Review-Fall gezählt und angezeigt.

Inbox-Metadaten werden als JSON neben dem Source-File geschrieben. Die Felder sind:

- `id`
- `createdAt`
- `kind`
- `metadataPath`
- `mimeType`
- `originalFilename`
- `processedAt`
- `size`
- `sourcePath`
- `status`
- `title`
- `error`

Textähnliche Dateitypen, die aktuell gelesen werden können:

- `.csv`
- `.html`
- `.json`
- `.log`
- `.md`
- `.mdx`
- `.txt`
- `.xml`
- `.yaml`
- `.yml`

Nicht-textuelle Dateien werden aktuell als gespeicherte Quellen behandelt. Für Voice-Dateien wird bisher nur ein Platzhalter für ausstehende Transkription erzeugt.

## 4. Ziel-Flow

Der gewünschte robuste Ziel-Flow ist:

```text
Website Upload / Text Capture / Voice Capture
  -> inbox/pending
  -> lokaler Abend-Befehl mit Codex
  -> Text normalisieren oder Audio transkribieren
  -> unveränderte Quelle nach raw/
  -> Source-Page in wiki/sources erzeugen
  -> relevante Wiki-Seiten aktualisieren
  -> index.md und log.md aktualisieren
  -> optional One-Way-Mirror nach Obsidian
```

Der Button oder Befehl "Einlesen" sollte langfristig nicht bedeuten: unkontrolliert alles mit AI veröffentlichen. Er sollte bedeuten: pending private Daten lokal und nachvollziehbar in die private Wissensbasis einlesen.

## 5. Fehlende Bausteine

Pending-Dateien anzeigen:

- Ist grundsätzlich vorhanden.
- Es fehlt noch eine stärkere Trennung zwischen reiner Inbox-Übersicht und tatsächlichem Einlesen.
- Hilfreich wären Filter nach `pending`, `manual-review`, `failed`, `voice`, `file`, `text`.

Lokaler Processing-Befehl:

- Fehlt als separater Command.
- Die vorhandene Funktion `processPendingInboxItems` hängt an Server Actions.
- Ziel ist ein lokales Script oder CLI, das dieselbe Datenbasis verwendet, aber bewusst lokal ausgeführt wird.

Textquellen nach `raw/` übernehmen:

- Ist teilweise vorhanden.
- Pending Items werden bereits nach `raw/inbox` kopiert.
- Es braucht klare Regeln, ob Inbox-Source-Dateien nach erfolgreicher Verarbeitung verschoben, kopiert oder archiviert werden.

Wiki-Stub/Source-Pages erzeugen:

- Ist vorhanden.
- Source-Pages enthalten derzeit vor allem Source-Referenz, Extracted Content oder Platzhalter und Filing-Hints.
- Später sollte daraus eine normalisierte Source-Page mit Metadaten, Kurzfassung, Zitaten/Exzerpten und Folge-Links werden.

`index.md` und `log.md` aktualisieren:

- Ist vorhanden.
- `refreshGeneratedCatalog` pflegt einen generierten Catalog.
- `appendLog` schreibt Verarbeitungsschritte.
- Es fehlt noch ein klarer local-processing Run-Bericht.

Transkription von Audio:

- Fehlt.
- Voice-Captures werden gespeichert, aber nicht transkribiert.
- Audio sollte zuerst als unveränderte Quelle erhalten bleiben; die Transkription wird als abgeleitete Textquelle gespeichert.

AI-Synthese:

- Noch nicht echt implementiert.
- `OPENAI_API_KEY` und `LLM_WIKI_MODEL` werden geprüft, aber der aktuelle Manager erzeugt keine echte Modellantwort.
- Ohne API-Key werden Items auf `manual-review` gesetzt.

Obsidian-Mirror:

- Fehlt.
- Benötigt ein lokales One-Way-Script von `.local-data/llm-wiki/wiki` in einen konfigurierbaren Obsidian-Vault.
- Der Mirror darf nie automatisch zurück in die kanonische Wiki-Struktur schreiben.

Website-Veröffentlichung:

- Fehlt bewusst.
- Es braucht später ein explizites Freigabe- oder Exportmodell.
- `raw` und `wiki` dürfen nicht automatisch öffentlich werden.

## 6. Empfohlene Implementierungsreihenfolge

1. Pending-Dateien anzeigen

   Die bestehende Inbox-Übersicht stabilisieren. Zuerst nur Sichtbarkeit verbessern: Status, Art, Größe, Erstellzeit, Fehler, Quelle. Keine automatische AI-Verarbeitung.

2. Lokalen Processing-Befehl vorbereiten

   Ein lokales Script oder CLI schaffen, das pending Items sicher lesen kann. Dieser Befehl sollte dry-run-fähig sein und zuerst nur zusammenfassen, was verarbeitet würde.

3. Textquellen sauber nach `raw/` übernehmen

   Für `text` und textähnliche `file`-Items robuste Übernahme nach `raw/inbox` definieren. Quellen bleiben unverändert. Abgeleitete Normalisierungen werden separat erzeugt.

4. Wiki-Stub/Source-Pages erzeugen

   Source-Pages aus pending Items erzeugen oder aktualisieren. Zuerst ohne AI-Synthese: Titel, Quelle, Typ, Pfad, Extrakt oder Platzhalter, Filing-Hints, Status.

5. `index.md` und `log.md` aktualisieren

   Den vorhandenen Catalog- und Log-Mechanismus im lokalen Processing-Flow nutzen. Zusätzlich einen Run-Summary-Eintrag erzeugen, damit nachvollziehbar bleibt, was beim Abend-Processing passiert ist.

6. Obsidian-Mirror-Script vorbereiten

   Ein One-Way-Script bauen, das `wiki/` in einen lokalen Vault spiegelt, z. B. nach `C:\Users\ostre\Documents\Obsidian\LLM-Wiki-Mirror`. Es sollte Zielpfad-Checks, Dry-Run und klare Warnungen enthalten.

7. Erst danach echte AI-/Transkriptions-Integration

   Audio-Transkription und AI-Synthese erst integrieren, wenn der nicht-AI Flow stabil ist. Die Integration sollte getrennte Schritte für Transkription, Normalisierung, Source-Page und Wiki-Synthese haben.

## 7. Sicherheitsregeln

- `.local-data/` niemals committen.
- Keine Uploads, Voice-Dateien, Transkripte, Auth-Daten, Sessions oder private Wiki-Inhalte ins Repo schreiben.
- Keine Secrets oder `.env`-Werte ausgeben.
- `raw/` als unveränderte Quellenbasis behandeln.
- `wiki/` als kanonische private Markdown-Wissensbasis behandeln.
- Obsidian nur als One-Way-Mirror verwenden.
- Keine automatische Rück-Synchronisierung aus Obsidian.
- Keine automatische Veröffentlichung aus `raw/` oder `wiki/`.
- Jeder lokale Processing-Lauf muss nachvollziehbar sein.
- Fehlerhafte oder unklare Items müssen reviewbar bleiben und dürfen nicht still verloren gehen.
- Der lokale Processing-Befehl sollte mit Pfad-Sicherheitschecks arbeiten und nur innerhalb von `.local-data/llm-wiki` schreiben.

## 8. Offene Entscheidungen

- Soll der lokale Processing-Befehl als npm script, Node CLI, PowerShell wrapper oder Codex-Prozedur umgesetzt werden?
- Soll `processPendingInboxItems` wiederverwendet oder in eine serverunabhängige Service-Schicht extrahiert werden?
- Werden pending Source-Dateien nach erfolgreichem Processing verschoben, kopiert oder als Archiv in `processed` behalten?
- Wo soll eine abgeleitete Audio-Transkription liegen: `raw/transcripts`, `raw/inbox`, `wiki/sources` oder als eigenes Derivat neben der Audioquelle?
- Welches Transkriptionssystem soll später genutzt werden?
- Soll der Obsidian-Mirror vollständige Wiki-Dateien spiegeln oder zusätzlich Obsidian-spezifische Index-/README-Dateien erzeugen?
- Wie wird später explizit markiert, welche Wiki-Inhalte auf der Website erscheinen dürfen?
- Soll der VPS nur Uploads sammeln oder auch eine verschlüsselte/gesicherte Übergabe an den lokalen Rechner unterstützen?
