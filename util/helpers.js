function filterEnrolledRaces(allRaceArray, userEnrolled){

    helper = id => allRaceArray.filter(item => item.id === id);

    
    let final = [];

    for (let i = 0; i < userEnrolled.length; i++){

        final = final.concat(helper(userEnrolled[i].race));

    }

    return final;
}

module.exports = filterEnrolledRaces;