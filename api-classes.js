const BASE_URL = "https://hack-or-snooze-v2.herokuapp.com";

/************************************************************************************************************************/

/*
This class maintains the list of individual Story instances
It also has some methods for fetching, adding, and removing stories
*/
class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /********************************************************************************/

  /*
  This method is designed to be called to generate a new StoryList.
  It calls the API, builds an array of Story instances, makes a single StoryList
  instance out of that, and then returns the StoryList instance.
  * 
  Note the presence of the `static` keyword: this indicates that getStories
  is **not** an instance method. Rather, it is a method that is called on the
  class directly. Why doesn't it make sense for getStories to be an instance method?
  */
  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await $.getJSON(`${BASE_URL}/stories`);
    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.stories.map(story => new Story(story));
    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories)
    return storyList;
  }

  /********************************************************************************/

  /*
  Method to make a POST request to /stories and add the new story to the list
  The function should accept the current instance of User who will post the story
  It should also accept an object which with a title, author, and url
  */
  async addStory(user, newStory) {
    // this function should return the newly created story so it can be used in the script.js file where it will be appended to the DOM
    let requestBody = {
      token: user.loginToken,
      story: newStory
    }
    let post = await $.post(`${BASE_URL}/stories`, requestBody);
    let storyInstance = new Story(post.story);
    //
    this.stories.unshift(storyInstance);
    user.ownStories.unshift(storyInstance);
    //
    return storyInstance;
  }

  /********************************************************************************/

  /*
  Delete a story from the DB as well as locally
  */
  async delStory(id, user) {
    // send delete request to API
    let delResponse = await $.ajax({
      url: `${BASE_URL}/stories/${id}`,
      type: "DELETE",
      data: { token: user.loginToken }
    });
    // remove story from current StoryList
    this.stories = this.stories.filter(storyObj => storyObj.storyId !== id);
    // return delete response
    return delResponse.story;
  }
}

/************************************************************************************************************************/

/*
The User class to primarily represent the current user.
There are helper methods to signup (create), login, and getLoggedInUser
*/
class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /********************************************************************************/

  /*
  A class method to create a new user - it accepts a username, password and name
  It makes a POST request to the API and returns the newly created User as well as a token
  */
  static async create(username, password, name) {
    const response = await $.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });
    // build a new User instance from the API response
    const newUser = new User(response.user);
    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.token;
    return newUser;
  }

  /********************************************************************************/

  /*
  A class method to log in a user. It returns the user 
  */
  static async login(username, password) {
    const response = await $.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });
    // build a new User instance from the API response
    const existingUser = new User(response.user);
    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.user.favorites.map(story => new Story(story))
    existingUser.ownStories = response.user.stories.map(story => new Story(story));
    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.token;
    return existingUser;
  }

  /********************************************************************************/

  /*
  This function uses the token & username to make an API request to get details
  about the user. Then it creates an instance of user with that inf function.
  */
  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;
    // call the API
    const response = await $.getJSON(`${BASE_URL}/users/${username}`, {
      token
    });
    // instantiate the user from the API information
    const existingUser = new User(response.user);
    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;
    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.user.favorites.map(
      story => new Story(story)
    );
    existingUser.ownStories = response.user.stories.map(
      story => new Story(story)
    );
    return existingUser;
  }

  /********************************************************************************/

  /*
  Add fav to api and update local user memory with response
  */
  async addFav(story) {
    let addResponse = await $.post(`${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, { token: this.loginToken });
    this.favorites = addResponse.user.favorites;
    return addResponse.user;
  }

  /********************************************************************************/


  /*
  Delete fav from api and update local user memory with response
  */
  async delFav(story) {
    let delResponse = await $.ajax({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      type: "DELETE",
      data: { token: this.loginToken }
    });
    this.favorites = delResponse.user.favorites;
    return delResponse.user;
  }

  /********************************************************************************/

  /*
  Delete story from local user memory
  */
  deleteStory(id) {
    // remove story from user's favorites
    let index = this.favorites.findIndex(storyObj => storyObj.storyId === id)
    if (index !== -1) {
      this.favorites.splice(index - 1, 1);
    }
    // remove story from user's own stories
    this.ownStories = this.ownStories.filter(storyObj => storyObj.storyId !== id);
  }
}

/************************************************************************************************************************/

/*
Class to represent a single story. Has one method to update.
*/
class Story {
  /*
  The constructor is designed to take an object for better readability / flexibility
  */
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }

  // updateStory() {}

}