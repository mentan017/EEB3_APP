document.getElementById('submit-btn').addEventListener('click', async function(e){
    e.stopImmediatePropagation();
    ResetErrors();
    var Email = document.getElementById('email-input').value || "";
    if(Email.split(" ").join("") == ""){
        document.getElementById('empty-email').classList.remove("hidden");
    }else{
        var response = await fetch('/email/newtoken', {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({Email: Email})
        });
        if(response.status == 401){
            var responseData = await response.json();
            if(responseData.code == 0){
                document.getElementById('invalid-email').classList.remove("hidden");
            }else if(responseData.code == 1){
                document.getElementById('no-user-email').classList.remove("hidden");
            }else if(responseData.code == 2){
                document.getElementById('activated-account').classList.remove("hidden");
            }
        }else if(response.status == 200){
            window.alert("An email was sent to your inbox with a link to verify your account.");
            var responseData = await response.json();
            window.location.href = responseData.url;
        }
    }
});
function ResetErrors(){
    var Errors = document.getElementsByClassName('error');
    for(var i=0; i<Errors.length; i++){
        Errors[i].classList.add('hidden');
    }
}