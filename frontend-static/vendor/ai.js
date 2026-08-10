window.claude = {
  complete: function(prompt) {
    return fetch('/api/ai/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt }),
    }).then(function(r) {
      if (!r.ok) throw new Error('AI error ' + r.status);
      return r.json();
    }).then(function(d) { return d.text; });
  }
};
