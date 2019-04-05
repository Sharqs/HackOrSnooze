$(async function() {
  
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $favoritedArticles = $("#favorited-articles");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navNewStory =$("#nav-new-story");
  const $newStoryForm = $("#new-story-form");
  // global storyList variable
  let storyList = null;
  // global currentUser variable
  let currentUser = null;
  await checkIfLoggedIn();
  
  /********************************************************************************/

  /*
  On page load, checks local storage to see if the user is already logged in.
  Renders page information accordingly.
  */
  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    // if there is a token in localStorage, call User.getLoggedInUser
    // to get an instance of User with the right details
    // this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /********************************************************************************/

  /*
  A rendering function to run to reset the forms and hide the login info
  */
  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();
    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");
    // show the stories
    $allStoriesList.show();
    // update the navigation bar
    showNavForLoggedInUser();
  }

  /********************************************************************************/

  /*
  A rendering function to call the StoryList.getStories static method,
  which will generate a storyListInstance. Then render it.
  */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();
    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /********************************************************************************/

  function updateFavorites() {
    $favoritedArticles.empty();
    for (let story of currentUser.favorites) {
      const result = generateStoryHTML(story);
      $favoritedArticles.prepend(result);
    }
  }

  /********************************************************************************/

  /*
  A function to render HTML for an individual Story instance
  */
  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}" class="list-group-item">
        <i class="far fa-star hidden"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return storyMarkup;
  }

  /********************************************************************************/

  /*
  Hide all elements in elementsArr
  */
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  /********************************************************************************/

  /*
  Show nav for logged in user
  */

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navNewStory.show();
    $("i").show();
    $(".filters").show();
  }

  /********************************************************************************/

  /*
  Simple function to pull the hostname from a URL (FURTHER STUDY: try prop("hostname"))
  */
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /********************************************************************************/

  /*
  Sync current user information to localStorage
  */
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  /************************************************************************************************************************/
  /*** LISTENERS **********************************************************************************************************/
  /************************************************************************************************************************/

  /*
  Event listener for signing up.
  If successfully we will setup a new user instance
  */
  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh
    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();
    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /********************************************************************************/

  /*
  Event listener for logging in.
  If successfully we will setup the user instance
  */
  $loginForm.on("submit", async function(evt) {
    evt.preventDefault();
    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();
    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /********************************************************************************/

  /*
  Log Out Functionality
  */
  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /********************************************************************************/

  /*
  Event Handler for login button
  */
  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
  });

  /********************************************************************************/

  /*
  Event handler for navigation to Homepage
  */
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /********************************************************************************/

  /*
  Dropdown for the new story form
  */
  $navNewStory.on("click", function (){
    $newStoryForm.slideToggle();
  });

  /********************************************************************************/

  /*
  On submitting new story compile obj and call addStory function
  */
  $newStoryForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit
    let newStoryObj = {
      author: $("#new-story-author").val(),
      title: $("#new-story-title").val(),
      url: $("#new-story-url").val()
    }
    $newStoryForm.trigger("reset");
    $newStoryForm.slideToggle();
    let newPost = await storyList.addStory(currentUser, newStoryObj);
    let postHtml = generateStoryHTML(newPost);
    let badgeHtml = `<span class="badge badge-warning">NEW</span> `
    $("#all-articles-list").prepend(postHtml);
    $(".articles-container i").first().show();
    $("#all-articles-list li:nth-child(1)").find("strong").prepend(badgeHtml);
  });

  /********************************************************************************/

  /*
  When user toggles star, modify favorites list
  */
  $(".articles-container").on("click", "i", async function(e) {
    e.preventDefault();
    //
    let targetId = $(e.target).parent().attr("id");
    // let list = storyList.stories;
    let targetStory = storyList.stories.find(story => story.storyId === targetId);
    let star = $(e.target)[0];
    //
    if ($(star).hasClass('far')) {
      let res = await currentUser.addFav(targetStory);
      if (res) {
        $(star).removeClass('far');
        $(star).addClass('fas');
      }
    }
    //
    else {
      let res = await currentUser.delFav(targetStory);
      if (res) {
        $(star).removeClass('fas');
        $(star).addClass('far');
      }
    }
  });

  /********************************************************************************/

  $("#fav-btn").on("click", function(e) {
    console.log("hello")
    updateFavorites();
    $(".btn-light").css("background-color", "#fff");
    $("fav-btn").css("background-color", "#ccc");
    $("#favorited-articles").show();
    $("#all-articles-list").hide();
  });

});