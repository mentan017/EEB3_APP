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
            AddAbsence(email);
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
        AddAbsence(email);
    }
});
async function AddAbsence(email){
    if(email.includes('@')){
        var response = await fetch('/content/admin/addAbsence', {
            method: "PUT",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({Email: email})    
        });
        if(response.status == 200){

        }else if(response.status == 401){
            var responseData = await response.json();
            if(responseData.code == 0){
                window.alert("Today is a weekend, you cannot add absences yet");
            }else if(responseData.code == 1){
                //TODO Scroll to the teacher
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
                        AddAbsence(this.firstElementChild.lastElementChild.innerHTML);
                    }
                });
                SearchResults[i].addEventListener('click', function(e){
                    e.stopImmediatePropagation();
                    AddAbsence(this.firstElementChild.lastElementChild.innerHTML);
                });
            }
        }else if(response.status == 500){
            window.alert("An error occured in the servers. Please try again later.");
        }
    }
}