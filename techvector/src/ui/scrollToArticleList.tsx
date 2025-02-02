"use client";

import { FaArrowCircleDown } from "react-icons/fa";


function scrollButton(){
    const scrollToItem = () => {
        const targetElement = document.getElementById('articleList');
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    return (
        <FaArrowCircleDown className="absolute bottom-30 size-15" onClick={scrollToItem}/>
    )
};

export default scrollButton;