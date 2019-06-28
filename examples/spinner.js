
module.exports = function spinner() {
  process.stderr.write('\u001b[?25l');
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let idx = 0;

  const frame = () => frames[++idx % frames.length];
  const fn = setInterval(() => process.stderr.write(frame() + '\r'), 80);

  return () => {
    process.stderr.write('\u001b[?25h');
    clearInterval(fn);
  }
};
