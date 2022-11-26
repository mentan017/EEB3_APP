document.getElementById('submit-btn').addEventListener('click', async function(e){
    e.stopImmediatePropagation();
    ResetErrors();
    var Password = document.getElementById('password-input').value || "";
    var PasswordConfirmation = document.getElementById('password-input-confirmation').value || "";
    if(Password.split(" ").join("") == ""){
        document.getElementById('empty-password').classList.remove("hidden");
    }else if(PasswordConfirmation.split(" ").join("") == ""){
        document.getElementById('empty-password-confirmation').classList.remove("hidden");
    }else if(Password.split(" ").join("") != Password){
        document.getElementById("space-password").classList.remove("hidden");
    }else if(PasswordConfirmation != Password){
        document.getElementById("different-passwords").classList.remove("hidden");
    }else{
        //Hash the password
        Password = await hashValue(Password);
        var response = await fetch('/email/recover/', {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({password: Password})
        });
        if(response.status == 401){
            var responseData = await response.json();
            if(responseData.code == 0){
                window.alert('This token may have expired. You are being redirected to the main page');
                window.location.href = "/";
            }else if(responseData.code == 1){
                document.getElementById('invalid-password').classList.remove("hidden");
            }else if(responseData.code == 2){
                document.getElementById('inexisting-user').classList.remove("hidden");
            }else if(responseData.code == 3){
                document.getElementById('old-new-password').classList.remove("hidden");
            }
        }else if(response.status == 200){
            window.location.href = "/auth/login";
        }
    }
});
function ResetErrors(){
    var Errors = document.getElementsByClassName('error');
    for(var i=0; i<Errors.length; i++){
        Errors[i].classList.add('hidden');
    }
}
async function hashValue(variable){
    var varUint8 = new TextEncoder().encode(variable);
    var hashBuffer = await crypto.subtle.digest('SHA-256', varUint8);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    var hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return(hashHex);
}