document.getElementById('register-btn').addEventListener('click', async function(e){
    e.stopImmediatePropagation();
    //Reset all errors
    ResetErrors();
    //Get the inputs
    var Email = document.getElementById('email-input').value || "";
    var Name = document.getElementById('name-input').value || "";
    var Password = document.getElementById('password-input').value || "";
    var PasswordConfirmation = document.getElementById('password-input-confirmation').value || "";
    //Verify that the inputs are valid
    if(Email.split(" ").join("") == ""){
        document.getElementById('empty-email').classList.remove("hidden");
    }else if(Name.split(" ").join("") == ""){
        document.getElementById('empty-name').classList.remove("hidden");
    }else if(Password.split(" ").join("") == ""){
        document.getElementById('empty-password').classList.remove("hidden");
    }else if(PasswordConfirmation.split(" ").join("") == ""){
        document.getElementById('empty-password-confirmation').classList.remove("hidden");
    }else if(Email.split(" ").join("") != Email){
        document.getElementById('space-email').classList.remove("hidden");
    }else if(Password.split(" ").join("") != Password){
        document.getElementById("space-password").classList.remove("hidden");
    }else if(PasswordConfirmation != Password){
        document.getElementById("different-passwords").classList.remove("hidden");
    }else{
        //Hash the password
        Password = await hashValue(Password);
        //Do request to server
        var response = await fetch('/auth/register',{
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({email: Email, name: Name, password: Password})
        });
        if(response.status == 401){
            var responseData = await response.json();
            if(responseData.code == 0){
                document.getElementById('invalid-email').classList.remove("hidden");
            }else if(responseData.code == 1){
                document.getElementById('empty-name').classList.remove("hidden");
            }else if(responseData.code == 2){
                document.getElementById('empty-password').classList.remove("hidden");
            }else if(responseData.code == 3){
                document.getElementById('email-in-use').classList.remove("hidden");
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
async function hashValue(variable){
    var varUint8 = new TextEncoder().encode(variable);
    var hashBuffer = await crypto.subtle.digest('SHA-256', varUint8);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    var hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return(hashHex);
}