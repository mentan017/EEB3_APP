document.getElementById('login-btn').addEventListener('click', async function(e){
    e.stopImmediatePropagation();
    ResetErrors();
    //Get the inputs
    var Email = document.getElementById('email-input').value;
    var Password = document.getElementById('password-input').value;
    if(Email.split(" ").join("") == ""){
        document.getElementById('empty-email').classList.remove("hidden");
    }else if(Email.includes(" ")){
        document.getElementById('space-email').classList.remove("hidden");
    }else if(Password.split(" ").join("") == ""){
        document.getElementById('empty-password').classList.remove("hidden");
    }else if(Password.includes(" ")){
        document.getElementById('space-password').classList.remove("hidden");
    }else{
        //Hash password
        Password = await hashValue(Password);
        //Send login request
        var response = await fetch('/auth/login', {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({email: Email, password: Password})
        });
        if(response.status == 401){
            var responseData = await response.json();
            if(responseData.code == 0){
                document.getElementById('invalid-email').classList.remove("hidden");
            }else if(responseData.code == 1){
                document.getElementById('invalid-password').classList.remove("hidden");
            }else if(responseData.code == 2){
                document.getElementById('no-user').classList.remove("hidden");
            }else if(responseData.code == 3){
                document.getElementById('account-not-activated').classList.remove("hidden");
            }else if(responseData.code == 4){
                document.getElementById('wrong-password').classList.remove("hidden");
            }
        }else if(response.status == 200){
            window.location.href = "/";
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