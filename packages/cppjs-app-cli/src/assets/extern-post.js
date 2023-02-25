export default async function then(cb) {
    const m = {
      locateFile(path) {
        if(path.endsWith('.wasm')) {
          return "cpp.wasm";
        }
        return path;
      },
      onRuntimeInitialized() {
        cb(this);
      }
    };
    Module(m);
}
