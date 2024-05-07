const title = document.querySelector('.title')
const b2 = document.querySelector('.b2')
const m1 = document.querySelector('.m1')
const m2 = document.querySelector('.m2')

document.addEventListener('scroll', function() {
    let value = window.scrollY
    // console.log(value)
    title.style.marginTop = value * 1.1 + 'px'


    b2.style.marginBottom = -value + 'px'

    m1.style.marginBottom = -value * 1.1 + 'px'
    m2.style.marginBottom = -value * 1.3 + 'px'
})