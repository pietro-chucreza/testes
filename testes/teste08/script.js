
const botao = document.getElementById('btn-efeito');
const containerPrincipal = document.getElementById('meu-site-main');
const botaoFechar = document.getElementById('btn-fechar-popup');
const popUp = document.getElementById('janela-modal');

const cores = ['#1a0526', '#2d0b3d', '#11021c', '#330847'];
let indice = 0;

botao.addEventListener('click', () => {
    indice = (indice + 1) % cores.length;
    containerPrincipal.style.transition = 'background-color 0.4s ease';
    containerPrincipal.style.backgroundColor = cores[indice];
    popUp.classList.add('mostrar');
});

botaoFechar.addEventListener('click', () => {
    popUp.classList.remove('mostrar');
});

popUp.addEventListener('click', (evento) => {
    if (evento.target === popUp) {
        popUp.classList.remove('mostrar');
    }
});
