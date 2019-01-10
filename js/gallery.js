(_ => {
    let gallery = document.getElementById('works-container');

    function newGalleryItem(targetURL, imageURL, title, description, date){
        let container = document.createElement('div');
        container.style.backgroundImage = `url('${imageURL}')`;

        let titleEl = document.createElement('span');
        titleEl.appendChild(document.createTextNode(title));

        let descEl = document.createElement('span');
        descEl.appendChild(document.createTextNode(description));

        let dateEl = document.createElement('span');
        dateEl.appendChild(document.createTextNode(date));

        container.addEventListener('click', e => {
            window.location.href = targetURL;
        })

        gallery.appendChild(container);
    }
})();