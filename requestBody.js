export function readRequestBody(req, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (req.readableEnded || req.destroyed) return reject(new Error("Request body is no longer available"));
    let raw = "";
    const finish = (error, value) => {
      clearTimeout(timer);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      req.off("aborted", onAborted);
      if (error) reject(error); else resolve(value);
    };
    const onData = chunk => { raw += chunk; };
    const onEnd = () => {
      try { finish(null, raw ? JSON.parse(raw) : {}); }
      catch (error) { finish(error); }
    };
    const onError = error => finish(error);
    const onAborted = () => finish(new Error("Request was aborted"));
    const timer = setTimeout(() => finish(new Error("Request body timed out")), timeoutMs);
    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
    req.on("aborted", onAborted);
  });
}
