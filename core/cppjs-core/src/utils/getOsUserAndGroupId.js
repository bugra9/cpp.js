import os from 'os';

let osUserAndGroupId;
export default function getOsUserAndGroupId() {
    const userInfo = os.userInfo();
    if (!osUserAndGroupId) {
        const isInvalid = userInfo.uid === -1 && userInfo.gid === -1;
        osUserAndGroupId = isInvalid ? '0:0' : `${userInfo.uid}:${userInfo.gid}`;
    }
    return osUserAndGroupId;
}
