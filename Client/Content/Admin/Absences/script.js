window.onload = console.log("Test");

document.getElementById('name-input').addEventListener('focus', function(e){
    e.stopImmediatePropagation();
    document.getElementById('search-bar-container').classList.add('active');
});
document.getElementById('name-input').addEventListener('focusout', function(e){
    e.stopImmediatePropagation();
    var ActiveElement = getSelection().getRangeAt(0).commonAncestorContainer;
    console.log(ActiveElement);
    //document.getElementById('search-bar-container').classList.remove('active');
});
var SearchResults = document.getElementsByClassName('search-result');
for(var i=0; i<SearchResults.length; i++){
    console.log(i);
    SearchResults[i].addEventListener('focus', function(e){
        e.stopImmediatePropagation();
        console.log("Hallo!");
        document.getElementById('search-bar-container').classList.add('active');
    });
    SearchResults[i].addEventListener('focusout', function(e){
        //document.getElementById('search-bar-container').classList.remove('active');
    });
}