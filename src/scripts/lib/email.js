let emailConfirmation = /[?&]emailsent/.test(location.search);
if (emailConfirmation) {
  document.getElementById("email-confirm").style.display = "block";
  window.history.replaceState({}, document.title, "/");
  setTimeout(function(){ document.getElementById("email-confirm").style.display = "none" }, 5000);
}

let contactForm = document.getElementById('email-form');
contactForm.onsubmit = function(e) {
  e.preventDefault();
  contactForm.style.display = "none";
  document.getElementById('form-inflight').style.display = "block";
  ajaxPost(contactForm, function(res) {
    if (res.currentTarget.status === 200) {
      document.getElementById('form-inflight').style.display = "none";
      document.getElementById('form-ok').style.display = "block";
    } else {
      document.getElementById('form-inflight').style.display = "none";
      document.getElementById('form-notok').style.display = "block";
    }
  });
  return false;
};

function ajaxPost (form, callback) {
  var url = form.action,
      xhr = new XMLHttpRequest();

  //This is a bit tricky, [].fn.call(form.elements, ...) allows us to call .fn
  //on the form's elements, even though it's not an array. Effectively
  //Filtering all of the fields on the form
  var params = [].filter.call(form.elements, function(el) {
      //Allow only elements that don't have the 'checked' property
      //Or those who have it, and it's checked for them.
      return typeof(el.checked) === 'undefined' || el.checked || el.type !== 'checkbox' || el.type !== 'radio';
      //Practically, filter out checkboxes/radios which aren't checekd.
  })
  .filter(function(el) { return !!el.name; }) //Nameless elements die.
  .filter(function(el) { return !el.disabled; }) //Disabled elements die.
  .map(function(el) {
      //Map each field into a name=value string, make sure to properly escape!
      return encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value);
  }).join('&'); //Then join all the strings by &

  xhr.open("POST", url);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  //.bind ensures that this inside of the function is the XHR object.
  xhr.onload = callback.bind(xhr);

  //All preperations are clear, send the request!
  xhr.send(params);
}
