import { useState, useEffect, useMemo } from "react";

function Revenue(){

    //First get the list of prices of all the bookings already present in data base - seed data

    //

    function handleRevenueSplit({platformFeePercent: number, price: number}){
        const platformShare = price * (platformFeePercent / 100);
        const providerShare = price - platformShare;
    }

}


