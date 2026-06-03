#!/usr/bin/env node
// Parse Otter speech JSON from stdin, output cache-notes callout markdown to stdout
const chunks = [];
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => {
  const raw = chunks.join('');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    process.stderr.write('JSON parse error: ' + e.message + '\n');
    process.exit(1);
  }
  const s = data.speech || data;
  const speakers = {};
  (s.speakers || []).forEach((sp) => { speakers[sp.id] = sp.speaker_name; });

  // Notes: Summary + Details
  let out = '## 🤖 AI Notes\n\n### Otter\n\n> [!otter_notes]- Summary & Details\n';
  out += '> ### Summary\n> ' + (s.summary || '').replace(/\n/g, '\n> ') + '\n\n';
  out += '> ### Details\n';
  (s.speech_outline || []).forEach((o) => {
    out += '> **' + (o.text || '').replace(/\n/g, ' ') + '**\n';
    (o.segments || []).forEach((seg) => {
      out += '> - ' + (seg.text || '').replace(/\n/g, ' ').trim() + '\n';
    });
  });

  // Todos: key topics from summary
  out += '\n> [!otter_todos]- Suggested Next Steps\n';
  const topics = (s.summary || '').split(',').map((t) => t.trim()).filter(Boolean);
  topics.forEach((t) => { out += '> - ' + t + '\n'; });

  // Transcript: sorted by start_offset
  const trans = (s.transcripts || []).slice().sort((a, b) => (a.start_offset || 0) - (b.start_offset || 0));
  out += '\n> [!otter_transcript]- Transcript\n';
  trans.forEach((t) => {
    const who = t.speaker_id != null && speakers[t.speaker_id] ? speakers[t.speaker_id] + ': ' : '';
    out += '> ' + who + (t.transcript || '').replace(/\n/g, ' ') + '\n';
  });

  process.stdout.write(out);
});
