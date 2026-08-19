// Échappement HTML pour les vues, qui sont écrites en template strings.
//
// Les noms d'affichage, les URL d'avatar et les pseudos d'expéditeur viennent de
// la base ou d'un socket : aucun n'est validé côté serveur, et tous finissent
// dans du `innerHTML`. Sans échappement, un `display_name` du type
// `<img src=x onerror=...>` s'exécute chez quiconque affiche le profil.
//
// Usage : préfixer le gabarit par `html` et toutes les interpolations sont
// échappées automatiquement — impossible d'en oublier une.
//
//     el.innerHTML = html`<span>${user.display_name}</span>`;
//
// Pour injecter du balisage construit volontairement, l'emballer dans `raw` :
//
//     html`<ul>${raw(items.map(i => html`<li>${i.name}</li>`).join(''))}</ul>`

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Échappe aussi les quotes : indispensable en contexte d'attribut, où
// `<img src="${url}">` s'échappe d'un simple `"` sans cela.
export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

const RAW = Symbol('html.raw');

// Marque une valeur comme du balisage déjà sûr, à insérer sans échappement.
export function raw(markup) {
    return { [RAW]: String(markup) };
}

export function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        out += (value !== null && typeof value === 'object' && RAW in value)
            ? value[RAW]
            : escapeHtml(value);
        out += strings[i + 1];
    }
    return out;
}
