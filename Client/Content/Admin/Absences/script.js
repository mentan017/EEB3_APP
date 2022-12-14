window.onload = FetchAbsentTeachers();

document.getElementById('name-input').addEventListener('focus', function(e){
    e.stopImmediatePropagation();
    document.getElementById('search-bar-container').classList.add('active');
});
var SearchResults = document.getElementsByClassName('search-result-div');
for(var i=0; i<SearchResults.length; i++){
    SearchResults[i].addEventListener('click', function(e){
        console.log("Hello!");
        e.stopImmediatePropagation();
    });
    
    SearchResults[i].addEventListener('keypress', function(e){
        e.stopImmediatePropagation();
        if(e.keyCode == 13){
            console.log("Hello!");
        }
    });
}
document.addEventListener('click', function(e){
    var searchBarContainer = document.getElementById('search-bar-container');
    if(!(searchBarContainer.contains(e.target)) && (e.target != searchBarContainer)){
        document.getElementById('search-bar-container').classList.remove('active');
    }
});
document.getElementById('name-input').addEventListener('input', async function(e){
    e.stopImmediatePropagation();
    var searchQuery = this.value || "";
    FetchTeachers(searchQuery);
});
document.getElementById('name-input').addEventListener('keypress', function(e){
    if(e.keyCode == 13){
        if(document.getElementById('autocomplete-box').firstElementChild != null){
            var email = document.getElementById('autocomplete-box').firstElementChild.firstElementChild.lastElementChild.innerHTML;
            var name = document.getElementById('autocomplete-box').firstElementChild.firstElementChild.firstElementChild.innerHTML;
            AddAbsence(email, name);
        }
    }
});
document.getElementById('name-input').addEventListener('click', function(e){
    e.stopImmediatePropagation();
    var searchQuery = this.value || "";
    FetchTeachers(searchQuery);
});
document.getElementById('add-btn').addEventListener('click', function(e){
    e.stopImmediatePropagation();
    if(document.getElementById('autocomplete-box').firstElementChild != null){
        var email = document.getElementById('autocomplete-box').firstElementChild.firstElementChild.lastElementChild.innerHTML;
        var name = document.getElementById('autocomplete-box').firstElementChild.firstElementChild.firstElementChild.innerHTML;
        AddAbsence(email, name);
    }
});
async function AddAbsence(email, name){
    if(email.includes('@')){
        var response = await fetch('/content/admin/addAbsence', {
            method: "PUT",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({Email: email})    
        });
        if(response.status == 200){
            var AbsenceElement = `
            <div class="absence-element" email="${email}">
                <div class="absence-content-container">
                    <p class="absence-name"><b>${name}</b></p>
                    <p class="absence-email">${email}</p>
                    <div class="absent-periods-container">`;
            for(var i=0; i<9; i++){
                AbsenceElement += `
                <div class="absent-period">
                    <p>P${i+1}</p>
                    <input type="checkbox" class="period-input" period="${i}" checked>
                </div>`;
            }
            AbsenceElement += `
                    </div>
                </div>
                <div class="absence-actions-container">
                    <p class="cross-sign"><b>X</b></p>
                </div>
            </div>`;
            document.getElementById('absences-container').innerHTML = AbsenceElement + document.getElementById('absences-container').innerHTML;
            //Add Event listeners
            AddEventListeners();
        }else if(response.status == 401){
            var responseData = await response.json();
            if(responseData.code == 0){
                window.alert("Today is a weekend, you cannot add absences yet");
            }else if(responseData.code == 1){
                document.querySelectorAll(`[email="${email}"]`)[0].scrollIntoView();
            }else if(responseData.code == 2){
                window.alert("There aren't any teachers matching this email");
            }
        }else{
            window.alert("An error occured in the servers. Please try again later.");
        }
    }
}
async function FetchTeachers(searchQuery){
    if(searchQuery != ""){
        //Do the request to the server to fetch teachers with matching names
        var response = await fetch('/content/admin/fetchTeacherNames', {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({Query: searchQuery})    
        });
        if(response.status == 200){
            var responseData = await response.json();
            var SearchResults = "";
            for(var i=0; i<responseData.length; i++){
                SearchResults += `
                <li class="search-result">
                    <div class="search-result-div" tabindex="0" contenteditable="true">
                        <p contenteditable="false">${responseData[i].Name}</p>
                        <p contenteditable="false">${responseData[i].Email}</p>
                    </div>
                </li>`
            }
            document.getElementById('autocomplete-box').innerHTML = SearchResults;
            SearchResults = document.getElementsByClassName('search-result');
            for(var i=0; i<SearchResults.length; i++){
                SearchResults[i].addEventListener('keypress', async function(e){
                    if(e.keyCode == 13){
                        AddAbsence(this.firstElementChild.lastElementChild.innerHTML, this.firstElementChild.firstElementChild.innerHTML);
                    }
                });
                SearchResults[i].addEventListener('click', function(e){
                    e.stopImmediatePropagation();
                    AddAbsence(this.firstElementChild.lastElementChild.innerHTML, this.firstElementChild.firstElementChild.innerHTML);
                });
            }
        }else if(response.status == 500){
            window.alert("An error occured in the servers. Please try again later.");
        }
    }
}
async function FetchAbsentTeachers(){
    var response = await fetch('/content/admin/fetchAbsentTeachers', {
        method: "POST",
        headers: {'Content-type': 'application/json'}    
    });
    if(response.status == 200){
        var responseData = await response.json();
        for(var i=0; i<responseData.length; i++){
            var AbsenceElement = `
            <div class="absence-element" email="${responseData[i].Email}">
                <div class="absence-content-container">
                    <p class="absence-name"><b>${responseData[i].Name}</b></p>
                    <p class="absence-email">${responseData[i].Email}</p>
                    <div class="absent-periods-container">`
            for(var j=0; j<9; j++){
                var AbsentPeriod = `
                <div class="absent-period">
                    <p>P${j+1}</p>
                    <input type="checkbox" class="period-input" period="${j}"`;
                if(responseData[i].CancelledPeriods.includes(j)){
                    AbsentPeriod += ` checked`;
                }
                AbsentPeriod += `>
                </div>`;
                AbsenceElement += AbsentPeriod
            }
            AbsenceElement += `
                    </div>
                </div>
                <div class="absence-actions-container">
                    <p class="cross-sign"><b>X</b></p>
                </div>
            </div>`;
            document.getElementById('absences-container').innerHTML += AbsenceElement;
        }
        //Add Event listeners
        AddEventListeners();
    }else if(response.status == 500){
        window.alert("An error occured in the servers. Please try again later.");
    }
}
function AddEventListeners(){
    var Crosses = document.getElementsByClassName('cross-sign');
    for(var i=0; i<Crosses.length; i++){
        Crosses[i].addEventListener('click', async function(e){
            e.stopImmediatePropagation();
            var email = this.parentElement.parentElement.getAttribute('email');
            if(email.includes('@')){
                var response = await fetch('/content/admin/deleteAbsence', {
                    method: "DELETE",
                    headers: {'Content-type': 'application/json'},
                    body: JSON.stringify({Email: email})
                });
                if(response.status == 200){
                    this.parentElement.parentElement.remove();
                }else{
                    window.alert("An error occured");
                }
            }
        });
    }
    var PeriodInputs = document.getElementsByClassName('period-input');
    for(var i=0; i<PeriodInputs.length; i++){
        PeriodInputs[i].addEventListener('change', async function(e){
            e.stopImmediatePropagation();
            var Email = this.parentElement.parentElement.parentElement.parentElement.getAttribute('email');
            var Period = this.getAttribute('period');
            var Remove = !(this.checked);
            var response = await fetch('/content/admin/updateAbsentPeriods', {
                method: "PUT",
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({Email: Email, Period: Period, Remove: Remove})
            });
            if(response.status == 401){
                window.alert("There aren't any teachers with this email");
            }else if(response.status == 500){
                window.alert("An error occured in the servers. Please try again later.");
            }
        });
    }
}