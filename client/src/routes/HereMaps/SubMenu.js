import React, { useState, useEffect, } from 'react';
import styled from 'styled-components';
import styles from "./HereMaps.module.scss";


// const apikey = process.env.REACT_APP_HERE_API_KEY;

const SidebarLink = styled.div`
  display: flex;
  color: #242424;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  // list-style: none;
  height: 30px;
  text-decoration: none;
  font-size: 18px;
  border-bottom:1px solid;

  &:hover {
    background: #B8B8B8;
    border-left: 4px solid #632ce4;
    cursor: pointer;
  }
`;

const SidebarLabel = styled.span`
  margin-left: 10px;
`;

const DropdownLink = styled.div`
  background: #A8A8A8;
  height: 75px;
  padding-left: 3rem;
  display: block;
  border-bottom:1px solid #242424;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  color: #242424;
  font-size: 18px;

  &:hover {
    background: #888888;
    cursor: pointer;
  }
`;

const SideBarDiv = styled.div`
  width:100%;
  // padding:5px;
  // margin:5px;
  display:block;
  position:relative;
  font-size:15px;
`;

const SubMenu = ({ item, routeno }) => {
  const [subnav, setSubnav] = useState(false);
  const [data, setData] = useState({ time: 0, dist: 0 });
  // const [startingpoint, setStartingPoint] = useState(null);
  // const [endpoint, setEndPoint] = useState(null);
  const [traveltime, setTravelTime] = useState(null);
  const [traveldist, setTravelDist] = useState(null);
  const [tmode, setTmode] = useState(null);
  const showSubnav = () => setSubnav(!subnav);

  // async function getNamefromLattLong(value) {
  //   var url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${value.org}%2C${value.dest}&lang=en-US&apikey=${apikey}`;
  //   const response = await fetch(url);
  //   const data = await response.json();

  //   return data["items"][0]["title"];
  // }

  function getData() {
    var totaltime = 0;
    var totaldist = 0;
    // var oname = [];
    // var dname = [];
    var ttime = [];
    var tdist = [];
    var mode = [];
    item.forEach(async (section) => {
      totaltime += section.travelTime;
      totaldist += section.distance;
      ttime.push(section.travelTime / 60);
      tdist.push(section.distance / 1000);
      mode.push(section.transport.mode);
      // var olg = { org: section.begin.lat, dest: section.begin.lng };
      // var dlg = { org: section.end.lat, dest: section.end.lng };
      // var res = await getNamefromLattLong(olg);
      // var res1 = await getNamefromLattLong(dlg);
      // oname.push(res);
      // dname.push(res1);
    });

    // console.log(oname);
    // console.log(dname);
    // console.log(ttime);
    // console.log(tdist);
    // console.log(mode);
    setData({ time: totaltime / 60, dist: totaldist / 1000 });
    setTravelTime(ttime);
    setTravelDist(tdist);
    setTmode(mode);
    // console.log("render");
  }

  useEffect(getData, [item]);

  return (
    <>
      <SidebarLink onClick={showSubnav}>
        <div>
          <SidebarLabel>Route {routeno + 1}</SidebarLabel>
        </div>
        <div>
          {data.time.toFixed(1)} Min <br></br> {data.dist.toFixed(1)} Km
        </div>

      </SidebarLink>
      {subnav &&
        traveltime.map((item, index) => {
          return (
            <DropdownLink key={index}>
              <SideBarDiv>
                <div className={styles.label}>Section {index + 1}</div>
                {/* <div className={styles.clearfix}></div> */}
                <SidebarLabel className={styles.label1}>Time: {item.toFixed(1)} Min <br />Dist: {traveldist[index].toFixed(1)} Km </SidebarLabel>
                <div className={styles.clearfix}></div>
              </SideBarDiv>
              <SideBarDiv>
                <div className={styles.label2}>Mode: {tmode[index]}</div>
              </SideBarDiv>
            </DropdownLink>
          );
        })}
    </>
  );
};

export default SubMenu;
