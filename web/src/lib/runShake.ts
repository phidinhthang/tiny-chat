export const runShake = (selector: string) => {
  const target = document.querySelector(selector);

  if (target) {
    target.classList.add('shaking');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => {
      target.classList.remove('shaking');
    }, 1000);
  }
};
