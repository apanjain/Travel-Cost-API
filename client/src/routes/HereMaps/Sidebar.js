import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import SubMenu from './SubMenu';
import { IconContext } from 'react-icons/lib';

const NavIcon = styled(Link)`
  margin-left: 2rem;
  font-size: 2rem;
  height: 80px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const NavIcon1 = styled(Link)`
    margin: 1%;
    /* float:left; */
    vertical-align:middle;
    font-size: 1.7rem;
    position: absolute;
    top:2.1%;
    display: inline;
`;

const SidebarNav = styled.nav`
  overflow:scroll;
  background: #DFDFDF;
  width: 250px;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: fixed;
  top: 0;
  left: ${({ sidebar }) => (sidebar ? '0' : '-100%')};
  transition: 350ms;
  z-index: 10;
`;

const SidebarWrap = styled.div`
  width: 100%;
`;

const SidebarLink = styled.div`
//   display: flex;
  margin:auto;
  color: #242424;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  list-style: none;
  height: 60px;
  text-decoration: none;
  font-size: 18px;
`;


const Sidebar = ({ routes }) => {
    const [sidebar, setSidebar] = useState(false);

    const showSidebar = () => setSidebar(!sidebar);

    return (
        <>
            <IconContext.Provider value={{ color: '#108898' }}>
                {/* <Nav> */}
                <NavIcon1 to='#'>
                    <FaIcons.FaBars onClick={showSidebar} />
                </NavIcon1>
                {/* </Nav> */}
                <SidebarNav sidebar={sidebar}>
                    <SidebarWrap>
                        <NavIcon to='#'>
                            <AiIcons.AiOutlineClose onClick={showSidebar} />
                        </NavIcon>

                        {(routes && routes.length !== 0) ? (
                            routes.map((item, index) => {
                                return <SubMenu item={item} key={index} routeno={index} />;
                            })
                        ) : (
                            <SidebarLink>Either No routes available or You have not entered origin, dest and time value.</SidebarLink>
                        )}

                    </SidebarWrap>
                </SidebarNav>
            </IconContext.Provider>
        </>
    );
};

export default Sidebar;
