# LLM Wiki VPS Transfer Plan

## 1. Ziel

Die Live-Website auf dem VPS kann private LLM-Wiki-Uploads und Voice-Dateien in ihrer Runtime-Datenbasis sammeln. Der lokale PC soll diese pending Inbox-Dateien abends sicher herunterladen können, damit der lokale Codex-Processing-Flow sie einliest.

Dieser Schritt ist nur Vorbereitung: Es wird noch nichts vom VPS heruntergeladen, nichts gelöscht und nichts verschoben.

## 2. Lokale Pfade

Lokaler LLM-Wiki-Root:

```text
.local-data/llm-wiki
```

Lokale Pending Inbox:

```text
.local-data/llm-wiki/inbox/pending
```

Lokale Verarbeitung:

```bash
npm run llm-wiki:process -- --dry-run
npm run llm-wiki:process -- --run
```

## 3. Erwartete VPS-Pfade

Die systemd-Unit setzt produktiv:

```text
APP_DATA_DIR=/var/lib/oscarstreif
```

Der erwartete LLM-Wiki-Root auf dem VPS ist daher:

```text
/var/lib/oscarstreif/llm-wiki
```

Der erwartete Remote-Pending-Pfad ist:

```text
/var/lib/oscarstreif/llm-wiki/inbox/pending
```

## 4. Transfer-Prinzip

Der Transfer ist ein Pull vom lokalen PC aus:

```text
VPS llm-wiki/inbox/pending -> lokales .local-data/llm-wiki/inbox/pending
```

Der lokale Rechner ist die Processing-Umgebung. Der VPS bleibt Capture- und Hosting-Umgebung.

Der Transfer darf keine komplette Runtime-Datenbasis synchronisieren. Er soll nur pending Inbox-Dateien holen.

## 5. Was kopiert werden darf

Kopiert werden dürfen nur Dateien aus:

```text
llm-wiki/inbox/pending
```

Das umfasst typischerweise:

- Inbox-Metadaten-JSON
- zugehörige pending Text-Captures
- zugehörige pending Datei-Uploads
- zugehörige pending Voice-Dateien

Dateiinhalte dürfen im Terminal nicht angezeigt werden.

## 6. Was niemals kopiert werden darf

Niemals kopieren:

- komplette `/var/lib/oscarstreif`
- `auth-store.json`
- Session-Daten
- Invitations oder Member-Daten
- `.env` oder `.env.*`
- Secrets, Tokens, Keys oder Zertifikate
- `llm-wiki/raw`
- `llm-wiki/wiki`
- `llm-wiki/schema.md`, außer das später bewusst als separater Schema-Abgleich entworfen wird
- sonstige App-Runtime-Daten

## 7. Empfohlener Dry-Run-Befehl

Zuerst immer lokal planen:

```bash
npm run llm-wiki:pull-vps-inbox -- --dry-run --host <ssh-host> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki
```

Ohne `--host` bricht der Befehl sicher ab.

Ohne `--remote-root` schlägt das Script `/var/lib/oscarstreif/llm-wiki` vor, verwendet es aber nicht blind.

## 8. Empfohlener echter Pull-Befehl

Der echte Pull ist noch nicht implementiert. Nach Review des Dry-Runs kann später ein rsync-basierter Pull ergänzt werden, ungefähr nach diesem Prinzip:

```bash
rsync -av --protect-args --ignore-existing --include='*/' --include='*.json' --include='*.md' --include='*.txt' --include='*.webm' --include='*.m4a' --include='*.mp3' --exclude='*' <ssh-host>:/var/lib/oscarstreif/llm-wiki/inbox/pending/ .local-data/llm-wiki/inbox/pending/
```

Wichtig: Kein `--delete`, keine Remote-Löschung, keine Verschiebung auf dem VPS.

## 9. Offene Entscheidungen

- Welcher SSH-Host-Alias soll verbindlich verwendet werden?
- Soll später `rsync` oder `scp` genutzt werden?
- Sollen vorhandene lokale Dateien überschrieben oder nur fehlende Dateien ergänzt werden?
- Wie wird verhindert, dass dieselben VPS-Dateien mehrfach lokal verarbeitet werden?
- Soll es später einen separaten Remote-Archivierungsschritt geben, und wenn ja, nur nach erfolgreichem lokalen Import?
- Wie wird mit sehr großen Voice-Dateien oder unterbrochenen Transfers umgegangen?

## 10. Sicherheitsregeln

- Kein Transfer ohne expliziten SSH-Host.
- Kein blindes Verwenden von Remote-Defaults.
- Niemals komplette Runtime-Verzeichnisse kopieren.
- Nur `llm-wiki/inbox/pending` kopieren.
- Nichts auf dem VPS löschen.
- Nichts auf dem VPS verschieben.
- Keine Auth-, Session-, Secret- oder `.env`-Dateien kopieren.
- Keine privaten Upload-Inhalte im Terminal anzeigen.
- Lokales Ziel muss innerhalb `.local-data/llm-wiki/inbox/pending` liegen.
- `.local-data/` bleibt ignoriert und darf nicht committed werden.

## 11. Echter Pull mit lokalem Manifest

Der echte Pull ist konservativ implementiert und verändert den VPS nicht. Er listet remote nur lesend Dateien unter:

```text
/var/lib/oscarstreif/llm-wiki/inbox/pending
```

und lädt neue Dateien lokal nach:

```text
.local-data/llm-wiki/inbox/pending
```

Damit dieselben VPS-Dateien nicht bei jedem Pull erneut geladen werden, führt der lokale Rechner ein Runtime-Manifest:

```text
.local-data/llm-wiki/transfer/pulled-vps-inbox.json
```

Dieses Manifest wird nicht committed. Es speichert Host, Remote-Root, Aktualisierungszeit und pro gezogener Datei Metadaten wie Remote-Pfad, Dateiname, Größe, mtime, Pull-Zeitpunkt, lokalen Pfad und Transportmethode.

Echter Pull:

```bash
npm run llm-wiki:pull-vps-inbox -- --run --host <ssh-host> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki
```

Remote-Check ohne Download:

```bash
npm run llm-wiki:pull-vps-inbox -- --dry-run --check-remote --host <ssh-host> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki
```

Bewusstes erneutes Berücksichtigen bereits manifestierter Remote-Dateien:

```bash
npm run llm-wiki:pull-vps-inbox -- --run --force --host <ssh-host> --remote-root /var/lib/oscarstreif/llm-wiki --local-root .local-data/llm-wiki
```

`--force` überschreibt keine lokalen Kollisionen. Wenn ein lokaler Zielname bereits existiert, wird die Datei übersprungen und im Summary gemeldet.

Transport:

- `ssh` wird für die Remote-Dateiliste benötigt.
- `--transport auto|scp|rsync` kann den Transfer explizit steuern.
- Unter Windows nutzt `auto` bevorzugt `scp`, weil Windows-`rsync`-Pfad-/Quoting-Verhalten je nach Installation fragil sein kann.
- Auf Unix-artigen Systemen nutzt `auto` bevorzugt `rsync`, falls verfügbar; sonst `scp`.
- Remote-Dateien werden einzeln mit Argument-Arrays übertragen, ohne `--delete`, ohne Remote-Move und ohne Remote-Schreibzugriff.

Der Pull verwendet kein `--delete`, verschiebt keine Remote-Dateien und schreibt nichts auf dem VPS. Eine spätere Remote-Archivierung muss separat entworfen werden und darf erst nach erfolgreichem lokalen Import aktiviert werden.
