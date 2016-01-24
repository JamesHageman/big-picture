//
//  MainMenuViewController.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class MainMenuViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    var socketDelegate : SocketDelegate!
    var worksInProgress : [Picture]?
    var completedImages : [Picture]?
    var backgroundSelectedButtonColor : UIColor!, backgroundDeselectedButtonColor : UIColor!
    @IBOutlet var picturesTableView : UITableView!
    @IBOutlet var titleLabel : UILabel!
    @IBOutlet var worksInProgressButton : UIButton!
    @IBOutlet var completedWorksButton : UIButton!
    @IBOutlet var galleryCollectionView : UICollectionView!
    
    override func viewDidLoad() {
        socketDelegate = SocketDelegate(url: SocketDelegate.urlBase, menuVC: self)
        backgroundSelectedButtonColor = worksInProgressButton.backgroundColor
        backgroundDeselectedButtonColor = completedWorksButton.backgroundColor
    }
    
    @IBAction func beginPictureDrawing() {
        socketDelegate.askForImage { (picture) -> Void in
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let picVC = storyboard.instantiateViewControllerWithIdentifier("PictureDraw") as! PictureDrawViewController
            picVC.setPicture(picture, sDelegate: self.socketDelegate)
            self.navigationController?.pushViewController(picVC, animated: true)
        }
    }
    
    func goToViewWorkInProgressWithImageID(imageID: String) {
        socketDelegate.askForImageWithId(imageID) { (picture) -> Void in
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let imgVC = storyboard.instantiateViewControllerWithIdentifier("ImageProgress") as! ImageProgressViewController
            imgVC.setupImageProgressView(picture, sDelegate: self.socketDelegate)
            self.navigationController?.pushViewController(imgVC, animated: true)
        }
    }
    
    func goToContributeToWorkInProgressWithImageID(imageID: String) {
        socketDelegate.askForPictureWithId(imageID) { (picture) -> Void in
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let picVC = storyboard.instantiateViewControllerWithIdentifier("PictureDraw") as! PictureDrawViewController
            picVC.setPicture(picture, sDelegate: self.socketDelegate)
            self.navigationController?.pushViewController(picVC, animated: true)
        }
    }
    
    @IBAction func changeDisplayedImages(sender: UIButton) {
        if (sender == worksInProgressButton) {
            //display WIP
            worksInProgressButton.backgroundColor = backgroundSelectedButtonColor
            completedWorksButton.backgroundColor = backgroundDeselectedButtonColor
            galleryCollectionView.hidden = true
            picturesTableView.hidden = false
            titleLabel.text = "Works in Progress"
        }
        else if (sender == completedWorksButton) {
            //display completed works
            worksInProgressButton.backgroundColor = backgroundDeselectedButtonColor
            completedWorksButton.backgroundColor = backgroundSelectedButtonColor
            galleryCollectionView.hidden = false
            picturesTableView.hidden = true
            titleLabel.text = "Gallery"
        }
    }
    
    func receivePictures(wip: [Picture], comp: [Picture]) {
        worksInProgress = wip
        completedImages = comp
        picturesTableView.reloadData()
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell : WorkInProgressTableViewCell = tableView.dequeueReusableCellWithIdentifier("workInProgress")! as! WorkInProgressTableViewCell
        if let workInProgress = worksInProgress?[indexPath.row] {
            cell.setupCell(workInProgress.colors, gestureTargetP: self, imageIDP: workInProgress.imageID, title: workInProgress.friendlyName!)
        }
        return cell
    }
    
    func tableView(tableView: UITableView, heightForRowAtIndexPath indexPath: NSIndexPath) -> CGFloat {
        return 80
    }

    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if (worksInProgress != nil) {
            return worksInProgress!.count
        }
        else {
            return 0
        }
    }
    
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if (segue.identifier == "showPictureVCSegue") {
            if let picture = sender as? Picture, vc = segue.destinationViewController as? PictureDrawViewController {
                vc.setPicture(picture, sDelegate: self.socketDelegate)
            }
        }
        else if (segue.identifier == "showPictureProgressSegue") {
            if let picture = sender as? Picture, vc = segue.destinationViewController as? ImageProgressViewController {
                vc.setupImageProgressView(picture, sDelegate: self.socketDelegate)
            }
        }
    }
}
