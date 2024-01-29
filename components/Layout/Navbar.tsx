import {FC} from "react";
import Image from 'next/image'


export const Navbar: FC = () => {
    return (
        <nav className="bg-navy-blue tssext-white px-4 py-2 flex items-center">
            <Image src='https://www.sanfranciscopolice.org/themes/custom/sfpd/logo.svg' alt='SFPD Logo' width={50} height={50}/>
            <div className="text-lg font-bold text-gold ml-2">SFPD.ai</div>
        </nav>
    );
};