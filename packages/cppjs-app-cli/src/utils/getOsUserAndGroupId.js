import os from "os";

let osUserAndGroupId;
export default function getOsUserAndGroupId() {
    const userInfo = os.userInfo();
    if (!osUserAndGroupId) {
        osUserAndGroupId = `${userInfo.uid}:${userInfo.gid}`;
    }
    return osUserAndGroupId;
}
