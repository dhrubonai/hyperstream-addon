// Minimal test worker
export default {
  async fetch(request) {
    return new Response(JSON.stringify({status: "ok"}), {
      headers: {'Content-Type': 'application/json'}
    });
  }
};
